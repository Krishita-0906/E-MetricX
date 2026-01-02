import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = "http://127.0.0.1:5000/api";

const LoginForm = ({ isSignup, onLogin }) => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // Stores the specific message
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async () => {
        setError('');
        setLoading(true);

        const endpoint = isSignup ? '/signup' : '/login';
        const payload = isSignup ? { username, email, password } : { email, password };

        try {
            const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);
            
            if (response.data.user_id) {
    onLogin(response.data.user_id);
    
    // IF SIGNUP -> GO TO SETUP
    if (isSignup) {
        navigate('/setup');
    } else {
        navigate('/dashboard');
    }
}
        } catch (err) {
            // MAGICAL FIX: Read the specific message from the backend
            const serverMessage = err.response?.data?.message;
            setError(serverMessage || "Connection failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f7f6' }}>
            <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '350px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '20px', color: '#333' }}>
                    {isSignup ? 'Create Account' : 'Welcome Back'}
                </h2>

                {isSignup && (
                    <input 
                        type="text" placeholder="Username" 
                        value={username} onChange={e => setUsername(e.target.value)} 
                        style={inputStyle} 
                    />
                )}
                <input 
                    type="email" placeholder="Email Address" 
                    value={email} onChange={e => setEmail(e.target.value)} 
                    style={inputStyle} 
                />
                <input 
                    type="password" placeholder="Password" 
                    value={password} onChange={e => setPassword(e.target.value)} 
                    style={inputStyle} 
                />

                <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    style={{ ...btnStyle, backgroundColor: loading ? '#ccc' : '#008040', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                    {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Log In')}
                </button>

                {/* DYNAMIC ERROR MESSAGE (RED TEXT) */}
                {error && <p style={{ color: '#d32f2f', marginTop: '15px', fontSize: '0.9rem', fontWeight: 'bold' }}>{error}</p>}

                <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
                    {isSignup ? 'Already have an account?' : "Don't have an account?"} <br/>
                    <a href={isSignup ? "/login" : "/signup"} style={{ color: '#008040', fontWeight: 'bold', textDecoration: 'none' }}>
                        {isSignup ? 'Log In' : 'Sign Up'}
                    </a>
                </p>
            </div>
        </div>
    );
};

const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '12px', marginTop: '15px', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' };

export default LoginForm;