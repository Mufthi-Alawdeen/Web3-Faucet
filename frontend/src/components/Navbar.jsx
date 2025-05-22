import React from "react";
import MetanaLogo from "../assets/logo.png";

export default function Navbar() {
  return (
    <div
      style={{
        width: "100%",
        padding: "12px 24px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #ddd",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <img
          src={MetanaLogo} // Make sure logo.png is in public folder
          alt="Metana Logo"
          style={{ width: "42px", height: "42px", objectFit: "contain" }}
        />
        <span
          style={{
            fontWeight: "600",
            fontSize: "20px",
            color: "#1f2f69",
            fontWeight:"bold"
          }}
        >
          Metana Web3 Faucet
        </span>
      </div>
    </div>
  );
}
