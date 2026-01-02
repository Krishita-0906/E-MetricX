import React from 'react';
import { useNavigate } from 'react-router-dom'; // <-- 1. NEW: Import useNavigate

const featuresList = [
  "Emissions Calculator: Input mining data (diesel, electricity, explosives) to calculate total CO₂ (tonnes) by activity.",
  "Carbon Sink Estimation: Estimate CO₂ absorption from your mine's afforestation or green cover.",
  "Gap Analysis: Visual representation of the gap between total emissions and total absorption/sinks.",
  "Per Capita Emissions: Track efficiency by calculating emissions per employee-day.",
  "Pathway Suggestions / Simulations: Simulate 'what-if' scenarios (e.g., switching to solar) to plan reduction strategies.",
  "Visualization / Dashboard: Interactive graphs and charts showing emission trends and category breakdowns.",
  "Report Generation: Export comprehensive CSV/PDF reports for regulatory or internal documentation.",
  "Scalability and Flexibility: App designed to work for all mine types (open-cast, underground) and varying operational sizes."
];

const benefitsList = [
  "Regulatory Compliance: Easily generate documented reports needed for environmental regulations in India.",
  "Cost Optimization: Identify energy waste and high-emission activities to optimize costs.",
  "Enhanced Brand Image: Publicly demonstrate a commitment to carbon neutrality and sustainability.",
  "Informed Decision Making: Data-driven insights to choose the most effective, cost-efficient green pathways.",
  "Future-Proofing: Prepare your mine operations for a low-carbon economy and future carbon taxes/credits."
];

const LandingPage = ({ onLogin }) => {
  const navigate = useNavigate(); // <-- 2. NEW: Initialize useNavigate

  const heroStyle = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: 'white',
    // Aesthetics: Placeholder background
    background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 50, 0, 0.4)), #005600', 
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '0 20px',
    boxSizing: 'border-box',
  };

  const navStyle = { 
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', 
    zIndex: 1000,
    width: '100%',
    position: 'fixed', 
    top: 0,
    left: 0,
    boxSizing: 'border-box',
  };

  const authButtonStyle = {
    padding: '10px 20px',
    marginLeft: '15px',
    border: '1px solid white',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s, transform 0.1s',
  };

  const contentSectionStyle = {
    padding: '100px 10%',
    minHeight: '80vh',
    backgroundColor: 'white',
    color: '#333',
    boxShadow: '0 -5px 10px rgba(0,0,0,0.05)',
  };
  
  const altSectionStyle = {
    ...contentSectionStyle,
    backgroundColor: '#f0fff0',
  };

  const listStyle = {
    textAlign: 'left',
    maxWidth: '900px',
    margin: '30px auto',
    listStyleType: 'disc',
    paddingLeft: '20px',
  };

  return (
    <div className="landing-page">
      
      {/* Fixed Navigation/Auth (THE FIXED PART) */}
      <div style={navStyle}>
        {/* These now use the navigate function to go to the correct routes */}
        <button 
          style={authButtonStyle} 
          onClick={() => navigate('/login')} // <-- FIX
        >
          Login
        </button>
        <button 
          style={authButtonStyle} 
          onClick={() => navigate('/signup')} // <-- FIX
        >
          Sign Up
        </button>
      </div>

      {/* 1. HERO/WELCOME SECTION */}
      <header style={heroStyle}>
        <hgroup>
          <h1 style={{ fontSize: '5rem', marginBottom: '10px', fontWeight: 900, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            E-Metricx
          </h1>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 300 }}>
            Pioneering Carbon Neutrality in Indian Coal Mining.
          </h2>
          <button 
            style={{ 
              ...authButtonStyle, 
              backgroundColor: '#00cc66', 
              border: 'none', 
              marginTop: '40px', 
              fontSize: '1.2rem',
              transform: 'scale(1.05)',
              boxShadow: '0 4px 8px rgba(0, 204, 102, 0.6)'
            }} 
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            Explore Features ↓
          </button>
        </hgroup>
      </header>

      {/* 2. FEATURES SECTION */}
      <section style={contentSectionStyle}>
        <h2 style={{ fontSize: '2.5rem', color: '#008040', textAlign: 'center' }}>
            Core Features of E-Metricx 
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '50px', textAlign: 'center' }}>
          Discover the power tools that enable your mine to understand and reduce its environmental impact.
        </p>
        <ul style={listStyle}>
          {featuresList.map((feature, index) => (
            <li key={index} style={{ marginBottom: '20px', fontSize: '1.1rem', borderLeft: '3px solid #00cc66', paddingLeft: '15px' }}>
                <strong style={{color: '#005020'}}>{feature.split(':')[0]}:</strong> {feature.split(':')[1]}
            </li>
          ))}
        </ul>
      </section>

      {/* 3. BENEFITS SECTION */}
      <section style={altSectionStyle}>
        <h2 style={{ fontSize: '2.5rem', color: '#005020', textAlign: 'center' }}>
            Key Benefits for Mine Operators
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '50px', textAlign: 'center' }}>
          Achieve sustainability goals while optimizing costs and ensuring a path toward carbon neutrality.
        </p>
        <ul style={listStyle}>
          {benefitsList.map((benefit, index) => (
            <li key={index} style={{ marginBottom: '15px', fontSize: '1.1rem', listStyleType: 'square' }}>{benefit}</li>
          ))}
        </ul>
      </section>

      <footer style={{ padding: '40px', textAlign: 'center', backgroundColor: '#282c34', color: 'white' }}>
        <p>&copy; 2025 E-Metricx. Empowering Sustainable Mining.</p>
      </footer>
    </div>
  );
};

export default LandingPage;