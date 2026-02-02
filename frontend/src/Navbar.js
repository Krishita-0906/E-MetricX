import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, BarChart3, Sprout, ArrowLeftRight, TrendingUp, FileText, UserCircle, LogOut, Brain } from 'lucide-react';

const Navbar = ({ onLogout }) => {
  return (
  <div style={navStyle}>
    {/* 1. Header Area */}
    <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '30px', marginTop: '10px' }}>E-MetricX</h2>
    
    {/* 2. Scrollable Menu Area (Takes all available space) */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
      <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
      <NavItem to="/uploads" icon={<UploadCloud size={20} />} label="Data & Uploads" />
      <NavItem to="/emissions" icon={<BarChart3 size={20} />} label="Emissions" />
      <NavItem to="/sinks" icon={<Sprout size={20} />} label="Sinks & Gap" />
      <NavItem to="/compare" icon={<ArrowLeftRight size={20} />} label="Compare Years" />
      <NavItem to="/pathways" icon={<TrendingUp size={20} />} label="Pathways" />
      <NavItem to="/ai-analytics" icon={<Brain size={20} />} label="AI Analytics" />
      <NavItem to="/reports" icon={<FileText size={20} />} label="Reports" />
      <NavItem to="/profile" icon={<UserCircle size={20} />} label="Account" />
      </div>
          </div>
          );
};

const NavItem = ({ to, icon, label }) => (
<NavLink 
to={to} 
style={({ isActive }) => ({
  display: 'flex', alignItems: 'center', gap: '12px',
  padding: '12px 15px', textDecoration: 'none', color: isActive ? '#fff' : '#ffffffaa',
  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
  borderRadius: '8px', transition: '0.2s', fontSize: '0.95rem'
})}
 >
  {icon} <span>{label}</span>
  </NavLink>
);

const navStyle = {
  width: '250px', 
height: '100vh', 
background: '#1b5e20', 
padding: '20px',
 position: 'fixed', 
 left: 0, 
 top: 0, 
 display: 'flex', 
 flexDirection: 'column',
 boxSizing: 'border-box', // Crucial for padding math
  zIndex: 1000
};


export default Navbar;