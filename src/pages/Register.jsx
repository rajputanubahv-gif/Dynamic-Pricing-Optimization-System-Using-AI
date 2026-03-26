import { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import API from "../api";

function Register(){

  const [username,setUsername] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const register = async ()=>{
    setIsLoading(true);
    try {
      // Small delay for smooth UX transition
      await new Promise(resolve => setTimeout(resolve, 600));
      await API.post("/register",{username,email,password});
      alert("Registration successful! Please log in.");
      window.location="/";
    } catch (err) {
      console.error(err);
      alert("Registration failed. Please try again.");
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card" 
        style={{ width: '400px', padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--accent)', fontSize: '24px', fontWeight: 700, margin: 0 }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>Join the Nexus Portal network</p>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Username</div>
          <input 
            placeholder="Choose a username" 
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            style={{ marginBottom: '16px' }}
          />
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
            placeholder="Create a password" 
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            style={{ marginBottom: '8px' }}
          />
        </div>

        <button 
          className="glow-btn"
          onClick={register} 
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
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert('Google login failed')}
          />
        </div>
        
        <p className="auth-footer" style={{ marginTop: '16px', textAlign: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Have an account?</span> <Link to="/" style={{ fontSize: '13px' }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Register;