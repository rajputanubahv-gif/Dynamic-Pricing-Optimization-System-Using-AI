import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match");
      return;
    }
    try {
      await API.post("/reset-password", { token, new_password: newPassword });
      setStatus("success");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setStatus(`Error: ${err.response.data.detail}`);
      } else {
        setStatus("Error resetting password.");
      }
    }
  };

  if (!token) {
    return (
      <div className="glass-card animate-in" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
        <h2>Invalid Link</h2>
        <p>No reset token provided in the URL.</p>
        <Link to="/" className="glow-btn" style={{ marginTop: '1rem', display: 'inline-block' }}>Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="glass-card animate-in" style={{ width: '100%', maxWidth: '360px', margin: '0', padding: '24px' }}>
      <h2 style={{ fontSize: '16px', margin: '0 0 12px 0' }}>Reset password</h2>
      <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '12px' }}>Enter your new password.</p>

      {status === "success" ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '16px', color: 'var(--success)', fontSize: '13px' }}>✅ Password reset successfully!</p>
          <Link to="/" className="glow-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>Sign in</Link>
        </div>
      ) : (
        <>
          {status && status !== "success" && <p style={{ marginBottom: '12px', color: 'var(--danger)', padding: '8px', background: 'rgba(242, 72, 34, 0.1)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>{status}</p>}
          <div style={{ marginBottom: '12px' }}>
            <input 
              type="password" 
              placeholder="New Password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ marginBottom: '8px' }}
            />
            <input 
              type="password" 
              placeholder="Confirm Password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ marginBottom: '4px' }}
            />
          </div>
          <button className="glow-btn" onClick={handleReset}>Update password</button>
        </>
      )}
    </div>
  );
}

export default ResetPassword;
