import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Auth Layout Wrapper to ensure scrolling in App Shell
const AuthLayout = ({ children }) => (
  <div className="scrollable-pane" style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: '2rem 1rem'
  }}>
    {children}
  </div>
);

function App(){

  return(

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<AuthLayout><Login/></AuthLayout>}/>
        <Route path="/register" element={<AuthLayout><Register/></AuthLayout>}/>
        <Route path="/verify-email" element={<AuthLayout><VerifyEmail/></AuthLayout>}/>
        <Route path="/forgot-password" element={<AuthLayout><ForgotPassword/></AuthLayout>}/>
        <Route path="/reset-password" element={<AuthLayout><ResetPassword/></AuthLayout>}/>
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard/>
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>

  )

}

export default App;