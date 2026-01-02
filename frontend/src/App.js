import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';



// COMPONENTS
import Navbar from './Navbar';
import LoginForm from './LoginForm';
import LandingPage from './LandingPage'; 
import ProfileSetup from './ProfileSetup';

// PAGES
import Dashboard from './app_pages/Dashboard';
import Uploads from './app_pages/Uploads';
import Compare from './app_pages/Compare';
import Emissions from './app_pages/Emissions';
import Sinks from './app_pages/Sinks';
import Pathways from './app_pages/Pathways';
import Reports from './app_pages/Reports';
import Account from './app_pages/Account';

const App = () => {
  const [userId, setUserId] = useState(localStorage.getItem('userId'));

  const handleLogin = (id) => {
    localStorage.setItem('userId', id);
    setUserId(id);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setUserId(null);
  };

  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={!userId ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!userId ? <LoginForm isSignup={false} onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!userId ? <LoginForm isSignup={true} onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />


        {/* PRIVATE ROUTES (Protected) */}
        <Route path="/*" element={
          userId ? (
            <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>

              <Navbar />

              {/* 2. MAIN CONTENT (Takes remaining space) */}
              <div style={{ flex: 1, backgroundColor: '#f5f7fa', overflowY: 'auto',marginLeft: '250px' }}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/setup" element={<ProfileSetup />} />
                  <Route path="/uploads" element={<Uploads />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/emissions" element={<Emissions />} />
                  <Route path="/sinks" element={<Sinks />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/pathways" element={<Pathways />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/profile" element={<Account />} />
                  
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
            </div>
          ) : (
            <Navigate to="/" />
          )
        } />
      </Routes>
    </Router>
  );
};

export default App;