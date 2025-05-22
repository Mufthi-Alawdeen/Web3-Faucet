import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import logo from "../assets/logo.png"
import loadingGif from "../assets/email.gif";


const panelVariants = {
  hiddenLeft: {
    rotateY: 90,
    opacity: 0,
    scale: 0.8,
    transformOrigin: "left center",
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  hiddenRight: {
    rotateY: -90,
    opacity: 0,
    scale: 0.8,
    transformOrigin: "right center",
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  visible: {
    rotateY: 0,
    opacity: 1,
    scale: 1,
    transformOrigin: "center center",
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  exitLeft: {
    rotateY: -90,
    opacity: 0,
    scale: 0.8,
    transformOrigin: "left center",
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  exitRight: {
    rotateY: 90,
    opacity: 0,
    scale: 0.8,
    transformOrigin: "right center",
    transition: { duration: 0.6, ease: "easeInOut" },
  },
};

export default function Subscribe() {
  const [isNewUser, setIsNewUser] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", agree: false });
  const [checkEmail, setCheckEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const direction = isNewUser ? 1 : -1;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!form.agree) {
    Swal.fire({
      icon: "warning",
      title: "Please agree to receive updates/offers to subscribe",
    });
    return;
  }

  // Show loading modal with GIF
  Swal.fire({
    title: "Sending Verification Email...",
    html: `<img src="${loadingGif}" style="width: 120px; margin-top: 20px;" />`,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    background: "#fff",
  });

  try {
    await axios.post("http://localhost:4000/api/subscribe", {
      name: form.name,
      email: form.email,
    });

    // Show success after short delay
    setTimeout(() => {
      Swal.fire({
        icon: "success",
        title: "Verification email sent!",
        html: "Check your inbox and use the link in the email to get your tokens.",
        confirmButtonColor: "#1f2f69",
      });
    }, 600);

    setForm({ name: "", email: "", agree: false });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Subscription failed",
      text: error.response?.data?.error || "Please try again later.",
    });
  }
};


  const handleCheckSubscription = async () => {
    if (!checkEmail) {
      Swal.fire({
        icon: "warning",
        title: "Please enter your email to continue.",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:4000/api/check-subscription?email=${encodeURIComponent(
          checkEmail
        )}`
      );

      if (!res.data.exists) {
        Swal.fire({
          icon: "info",
          title: "Email not found",
          text: "Please subscribe first.",
        });
      } else if (res.data.verified) {
        window.location.href = `${window.location.origin}/faucet?verified=true&email=${encodeURIComponent(
          res.data.email
        )}`;
      } else {
        window.location.href = `${window.location.origin}/verify?token=${res.data.verificationToken}`;
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error checking subscription",
        text: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsNewUser(!isNewUser);
    setCheckEmail("");
    setForm({ name: "", email: "", agree: false });
  };

  return (
    <div
      className="d-flex vh-100 bg-light"
      style={{ perspective: 1500, padding: 30 }}
    >
      <div
        className="container my-auto shadow rounded overflow-hidden bg-white d-flex"
        style={{ maxWidth: 900, height: 580, position: "relative" }}
      >
        {/* Left Panel */}
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={isNewUser ? "form-new" : "form-existing"}
            custom={direction}
            variants={panelVariants}
            initial={direction > 0 ? "hiddenLeft" : "hiddenRight"}
            animate="visible"
            exit={direction > 0 ? "exitLeft" : "exitRight"}
            style={{
              backfaceVisibility: "hidden",
              order: isNewUser ? 1 : 2,
              flex: "1 1 50%",
              padding: "3rem",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {isNewUser ? (
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <h2 className="mb-4 text-center" style={{marginTop:"80px"}}>Subscribe to Metana Updates</h2>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  className="form-control"
                  value={form.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  style={{
                    padding:"15px"
                  }}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  className="form-control"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  style={{
                    padding:"15px"
                  }}
                />
                <div className="form-check">
                  <input
                    type="checkbox"
                    id="agree"
                    name="agree"
                    className="form-check-input"
                    checked={form.agree}
                    onChange={handleChange}
                    required
                    style={{
  outline: "2px solid #1f2f69",
  outlineOffset: "1px"
}}

                  />
                  <label className="form-check-label" htmlFor="agree">
                    By subscribing, I agree to receive updates and offer emails from
                    Metana.
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loading || !form.agree}
                  className="btn mt-3"
                  style={{
    backgroundColor: "#cffc03",
    color: "#1f2f69",
    border: "none",
    textDecoration: "none",
    fontWeight:"bold",
    padding:"10px"
  }}
                >
                  {loading ? "Subscribing..." : "Subscribe"}
                </button>
                <div className="mt-4 text-center" style={{marginBottom:"80px"}}>
                  <button
                    onClick={toggleMode}
                    type="button"
                    className="btn btn-link"
                    style={{
    color: "#1f2f69",
    fontWeight: "bold",
  }}

                  >
                    Already subscribed? Enter your email here
                  </button>
                </div>
              </form>
            ) : (
              <div className="d-flex flex-column gap-3">
                <h2 className="mb-4 text-center">Already Subscribed?</h2>
                <input
                  type="email"
                  placeholder="Enter your subscribed email"
                  className="form-control"
                  value={checkEmail}
                  onChange={(e) => setCheckEmail(e.target.value.trim())}
                  autoComplete="email"
                />
                <button
                  onClick={handleCheckSubscription}
                  disabled={loading}
                  className="btn mt-3"
                     style={{
    backgroundColor: "#1f2f69",
    color: "#cffc03",
    border: "none",
    textDecoration: "none",
    padding:"10px",
    fontSize:"16px",
  }}
                >
                  {loading ? "Checking..." : "Continue"}
                </button>
                <div className="mt-4 text-center">
                  <button
                    onClick={toggleMode}
                    type="button"
                    className="btn btn-link"
                  >
                    New here? Subscribe now
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Right Panel */}
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
  key={isNewUser ? "info-new" : "info-existing"}
  className="d-flex flex-column justify-content-center align-items-center px-5"
  style={{
    backgroundColor: "#fff",
    backfaceVisibility: "hidden",
    borderTopLeftRadius: isNewUser ? "0.5rem" : "0",
    borderBottomLeftRadius: isNewUser ? "0.5rem" : "0",
    borderTopRightRadius: !isNewUser ? "0.5rem" : "0",
    borderBottomRightRadius: !isNewUser ? "0.5rem" : "0",
    order: isNewUser ? 2 : 1,
    padding: "3rem 2rem",
     color: "#1f2f69",
    flex: "1 1 50%",
    boxSizing: "border-box",
  }}
  custom={direction}
  variants={panelVariants}
  initial={direction > 0 ? "hiddenRight" : "hiddenLeft"}
  animate="visible"
  exit={direction > 0 ? "exitRight" : "exitLeft"}
>
  <img
    src={logo}
    alt="Metana Logo"
    style={{ width: 120, marginBottom: 20, objectFit: "contain" }}
  />
  <h2 className="mb-3 text-center">Metana Web3 Faucet</h2>
  <p className="text-center fs-5">
    Get Sepolia test ETH for your wallet by subscribing and verifying your email with Metana updates.
  </p>
  <p className="text-center fs-6 fst-italic mt-4">
    Fast, secure, and easy faucet access just for you.
  </p>
</motion.div>

        </AnimatePresence>
      </div>
    </div>
  );
}
