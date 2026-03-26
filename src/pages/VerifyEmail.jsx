import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../api";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying");

  const initialized = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    
    // Prevent double-firing in React 18 Strict Mode
    if (initialized.current) return;
    initialized.current = true;

    API.get(`/verify-email?token=${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="glass-card animate-in" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
      {status === "verifying" && <h2>Verifying...</h2>}
      {status === "success" && (
        <>
          <h2>Email Verified! 🎉</h2>
          <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>Your email has been successfully verified.</p>
          <Link to="/" className="glow-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>Go to Login</Link>
        </>
      )}
      {status === "error" && (
        <>
          <h2>Verification Failed ❌</h2>
          <p style={{ margin: '1rem 0', color: 'var(--danger)' }}>Invalid or expired verification token.</p>
          <Link to="/" className="glow-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>Go to Login</Link>
        </>
      )}
    </div>
  );
}

export default VerifyEmail;
