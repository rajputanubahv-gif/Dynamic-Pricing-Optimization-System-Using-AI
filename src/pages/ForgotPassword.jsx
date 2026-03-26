import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    try {
      const res = await API.post("/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage("Failed to send reset email. Please try again.");
    }
  };

  return (
    <div className="glass-card animate-in" style={{ width: '100%', maxWidth: '360px', margin: '0', padding: '24px' }}>
      <h2 style={{ fontSize: '16px', margin: '0 0 12px 0' }}>Forgot password</h2>
      <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
        Enter your email to receive a reset link.
      </p>

      {message && <p style={{ marginBottom: '8px', color: 'var(--accent)', padding: '8px', background: 'var(--accent-muted)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>{message}</p>}

      <div style={{ marginBottom: '12px' }}>
        <input 
          placeholder="Email address" 
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: '4px' }}
        />
      </div>

      <button className="glow-btn" onClick={handleReset} style={{ marginBottom: '12px' }}>Send reset link</button>
      
      <p className="auth-footer" style={{ marginTop: '12px' }}>
        <Link to="/">Back to sign in</Link>
      </p>
    </div>
  );
}

export default ForgotPassword;
