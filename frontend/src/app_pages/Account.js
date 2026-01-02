import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:5000/api";

const Account = () => {
  const userId = localStorage.getItem('userId');
  const [profile, setProfile] = useState(null);

  // Fetch actual user data
  useEffect(() => {
      axios.get(`${API_BASE_URL}/get-profile`, { headers: { 'X-User-ID': userId } })
          .then(res => setProfile(res.data))
          .catch(err => console.error(err));
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('userId'); 
    window.location.href = '/';
  };

  if (!profile) return <div style={{padding:'40px'}}>Loading profile...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '600px' }}>
      <h1 style={{ color: '#2d5a27', marginBottom: '20px' }}>Account Settings</h1>
      
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Profile Information</h3>
        
        {/* Dynamic Data from Database */}
        <p style={{ marginTop: '15px' }}><strong>Mine Name:</strong> {profile.mine_name}</p>
        <p><strong>Location:</strong> {profile.state}</p>
        <p><strong>Type:</strong> {profile.type}</p>
        <p><strong>Production:</strong> {profile.production} TPA</p>
        
        <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              backgroundColor: '#d32f2f', 
              color: 'white', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              width: 'fit-content'
            }}
          >
            Logout 
          </button>
        </div>
      </div>
    </div>
  );
};

export default Account;