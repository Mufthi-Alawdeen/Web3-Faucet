import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setMessage("Invalid verification token.");
      return;
    }

    // Redirect browser to backend verify URL to let server handle redirect
    window.location.href = `http://localhost:4000/api/verify?token=${token}`;
  }, [searchParams]);

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center bg-light p-4">
      <div
        className="bg-white p-4 rounded shadow"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <h2 className="mb-4 text-center">Email Verification</h2>
        <p className="text-center">{message}</p>
      </div>
    </div>
  );
}
