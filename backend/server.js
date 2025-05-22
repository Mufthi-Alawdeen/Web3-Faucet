require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const ethers = require("ethers");
const { Wallet, JsonRpcProvider, parseEther } = ethers;

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB with connection logging
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});
db.once("open", () => {
  console.log("MongoDB connected successfully!");
});

// Define User schema and model
// Define User schema and model with walletClaimTimestamps for cooldown tracking
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  verificationToken: String,
  verified: { type: Boolean, default: false },
  claimedWallets: [String],
  walletClaimTimestamps: {
    // map walletAddress -> timestamp of last claim
    type: Map,
    of: Date,
    default: {},
  },
});
const User = mongoose.model("User", userSchema);

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Setup ethers provider and wallet (Sepolia network)
const provider = new JsonRpcProvider(process.env.ETH_PROVIDER_URL);
const wallet = new Wallet(process.env.ETH_PRIVATE_KEY, provider);

// Subscribe endpoint: Save user and send verification email
app.post("/api/subscribe", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: "Name and Email required" });

  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.verified) {
    return res
      .status(400)
      .json({ error: "Email already subscribed and verified" });
  }

  const verificationToken = uuidv4();

  const user = await User.findOneAndUpdate(
    { email },
    { name, verificationToken, verified: false },
    { upsert: true, new: true }
  );

  const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your email for Sepolia Faucet",
    html: `
    <div style="
      background-image: url('cid:background');
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      padding: 40px;
      font-family: 'Segoe UI', sans-serif;
      color: #1f2f69;
      text-align: center;
    ">
      <!-- Logo -->
      <img src="cid:logo" alt="Metana Logo" style="width: 80px; margin-bottom: 20px;" />

      <!-- Title -->
      <h1 style="margin: 0; font-size: 26px;">Metana Web3 Faucet</h1>

      <!-- Message -->
      <p style="font-size: 22px; font-weight: 500; margin: 30px 0 10px;">
        Your email is verified.
      </p>
      <p style="font-size: 18px; font-weight: 400;">
        Collect your test tokens below.
      </p>

      <!-- CTA Button -->
      <a href="${verificationUrl}" style="
        display: inline-block;
        margin-top: 30px;
        padding: 12px 24px;
        border-radius: 30px;
        border: 2px solid #1f2f69;
        color: #1f2f69;
        font-weight: bold;
        text-decoration: none;
        font-size: 16px;
      ">
        Click here ↗
      </a>

    </div>
  `,
    attachments: [
      {
        filename: "logo.png",
        path: "./assets/logo.png", // e.g. './assets/logo.png'
        cid: "logo", // same as in <img src="cid:logo">
      },
      {
        filename: "bg.JPG",
        path: "./assets/bg.JPG", // your local background image path
        cid: "background",
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

// Verify endpoint: Mark user as verified and handle expired/used tokens gracefully
app.get("/api/verify", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Invalid verification link");
  }

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).send("Invalid or expired token");
    }

    if (!user.verified) {
      user.verified = true;
      // Do NOT clear the verificationToken here
      await user.save();
      console.log(`User ${user.email} verified and token retained.`);
    } else {
      console.log(`User ${user.email} already verified.`);
    }

    // Always redirect verified users to faucet page with their email
    return res.redirect(
      `${
        process.env.FRONTEND_URL
      }/faucet?verified=true&email=${encodeURIComponent(user.email)}`
    );
  } catch (err) {
    console.error("Error during verification:", err);
    return res.status(500).send("Internal server error");
  }
});

app.get("/api/check-subscription", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ exists: false });

    if (user.verified) {
      return res.json({ exists: true, verified: true, email: user.email });
    }

    return res.json({
      exists: true,
      verified: false,
      verificationToken: user.verificationToken,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Faucet endpoint: Send Sepolia test ETH to verified user wallet
app.post("/api/faucet", async (req, res) => {
  const { walletAddress, email } = req.body;
  if (!walletAddress || !email)
    return res.status(400).json({ error: "Wallet and Email required" });

  const user = await User.findOne({ email });
  if (!user || !user.verified)
    return res.status(401).json({ error: "User not verified" });

  const lastClaimed = user.walletClaimTimestamps.get(walletAddress);
  const now = new Date();

  if (lastClaimed) {
    const diffMs = now - new Date(lastClaimed);
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) {
      return res.status(400).json({
        error: `You can claim again after ${Math.ceil(24 - diffHours)} hours.`,
      });
    }
  }

  try {
    const tx = await wallet.sendTransaction({
      to: walletAddress,
      value: parseEther("0.02"),
    });
    await tx.wait();

    user.claimedWallets.push(walletAddress);
    user.walletClaimTimestamps.set(walletAddress, now);
    await user.save();

    res.json({ message: "Test ETH sent!", txHash: tx.hash });
  } catch (error) {
    console.error("Error sending ETH:", error);
    res.status(500).json({ error: "Failed to send test ETH" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
