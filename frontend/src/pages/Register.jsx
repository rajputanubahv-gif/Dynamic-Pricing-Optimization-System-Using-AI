import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";

function Register(){

  const [username,setUsername] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const register = async ()=>{
    try {
      await API.post("/register",{username,email,password});
      alert("Registration successful! Please log in.");
      window.location="/";
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        alert(`Registration failed: ${err.response.data.detail}`);
      } else {
        alert("Registration failed. Try again.");
      }
    }
  }

  return(
    <div className="glass-card animate-in" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <h2>Create Account</h2>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <input 
          placeholder="Username" 
          onChange={(e)=>setUsername(e.target.value)}
        />
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

      <button className="glow-btn" onClick={register}>Sign Up</button>
      
      <p className="auth-footer">
        Already have an account? <Link to="/">Login here</Link>
      </p>
    </div>
  )
}

export default Register;