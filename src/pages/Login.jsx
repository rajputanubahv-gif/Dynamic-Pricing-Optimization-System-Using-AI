import { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import API from "../api";

function Login(){

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    setIsLoading(true);
    try {
      // Small delay for smooth UX transition
      await new Promise(resolve => setTimeout(resolve, 600));
      const res = await API.post("/login",{email,password});
      if (res.data.access_token) {
        localStorage.setItem("token",res.data.access_token);
        window.location="/dashboard";
      } else {
        alert("Login failed: " + (res.data.error || "Invalid credentials"));
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await API.post("/auth/google", { token: credentialResponse.credential });
      if (res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
        window.location = "/dashboard";
      }
    } catch (err) {
      alert("Google login failed.");
    }
  };

  return (
    <div className="auth-container" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg-dark)'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={{ width: '400px', padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--accent)', fontSize: '24px', fontWeight: 700, margin: 0 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>Sign in to Nexus Portal</p>
        </div>
      
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Email Address</div>
          <input 
            placeholder="Enter your email" 
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            style={{ marginBottom: '16px' }}
          />
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Password</div>
          <input 
            type="password" 
            placeholder="Enter your password" 
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            style={{ marginBottom: '8px' }}
          />
        </div>

        <button 
          className="glow-btn"
          onClick={login} 
          disabled={isLoading}
          style={{ 
            marginBottom: '20px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 'var(--radius-sm)',
            width: '100%',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert('Google login failed')}
          />
        </div>
        
        <p className="auth-footer" style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link to="/forgot-password" style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Forgot Password?</Link>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No account?</span> <Link to="/register" style={{ fontSize: '13px' }}>Register</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;