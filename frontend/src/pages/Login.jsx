import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";

function Login(){

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const login = async () => {
    try {
      const res = await API.post("/login",{email,password});
      if (res.data.access_token) {
        localStorage.setItem("token",res.data.access_token);
        window.location="/dashboard";
      } else {
        alert("Login failed: " + (res.data.error || "Unknown error"));
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        alert(`Login failed: ${err.response.data.detail}`);
      } else {
        alert("Login failed. Check credentials.");
      }
    }
  }

  return(
    <div className="glass-card animate-in" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <h2>Welcome Back</h2>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <input 
          placeholder="Email address" 
          type="email"
          onChange={(e)=>setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password" 
          onChange={(e)=>setPassword(e.target.value)}
        />
      </div>

      <button className="glow-btn" onClick={login}>Sign In</button>
      
      <p className="auth-footer">
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  )
}

export default Login;