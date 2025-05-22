import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import loadingGif from "../assets/ethGif.gif"; // Ensure this path is correct

export default function Faucet() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [walletAddress, setWalletAddress] = useState("");
  const [email, setEmail] = useState("");
  const [txHash, setTxHash] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verified = searchParams.get("verified");
    const emailParam = searchParams.get("email");

    if (verified === "true" && emailParam) {
      setEmail(emailParam);
      setMessage(
        "Your email is verified! Please enter your wallet address to claim Sepolia test ETH."
      );
    } else {
      navigate("/");
    }
  }, [searchParams, navigate]);

  const handleClaim = async () => {
    if (!walletAddress) {
      Swal.fire({
        icon: "warning",
        title: "Missing Wallet Address",
        text: "Please enter your wallet address.",
      });
      return;
    }

    setLoading(true);
    setMessage("");
    setTxHash(null);

    Swal.fire({
      title: "Processing Transaction...",
      html: `<img src="${loadingGif}" alt="loading" style="width: 350px; margin-top: 20px;" />`,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const res = await axios.post("http://localhost:4000/api/faucet", {
        walletAddress,
        email,
      });

      setTxHash(res.data.txHash);
      setMessage("Sepolia test ETH sent!");

      Swal.fire({
        icon: "success",
        title: "Tokens Sent!",
        html: `
          <p>Your transaction is complete.</p>
          <a href="https://sepolia.etherscan.io/tx/${res.data.txHash}" target="_blank" rel="noopener noreferrer">
            View Transaction ↗
          </a>
        `,
        confirmButtonText: "Close",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Transaction Failed",
        text: err.response?.data?.error || "Failed to send tokens. Please try again.",
        confirmButtonText: "Close",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="bg-light py-5" style={{ minHeight: "100vh" }}>
        <div
          className="container d-flex flex-column justify-content-center align-items-center bg-white p-4 shadow rounded"
          style={{ maxWidth: "600px" }}
        >
          <h2 className="mb-4 text-center fw-bold" style={{ color: "#1f2f69" }}>
            Sepolia Test ETH Faucet
          </h2>

          <p className="text-center mb-3">{message}</p>

          <input
            type="text"
            placeholder="Enter your wallet address"
            className="form-control mb-3"
            style={{ maxWidth: "100%", padding: "12px" }}
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value.trim())}
          />

          <button
            onClick={handleClaim}
            disabled={loading}
            className="btn"
            style={{
              backgroundColor: "#cffc03",
              color: "#1f2f69",
              fontWeight: "bold",
              padding: "10px 20px",
              border: "none",
              width: "100%",
            }}
          >
            {loading ? "Sending..." : "Get Sepolia Test ETH"}
          </button>

          {txHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-decoration-none text-center text-success"
              style={{ wordBreak: "break-word" }}
            >
              View Transaction ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
