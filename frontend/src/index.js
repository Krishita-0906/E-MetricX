import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios'; // Import axios

// VITAL FIX: Disable cookie handling globally since we are using tokens.
// This prevents the browser from trying to send (and block) cookies.
axios.defaults.withCredentials = false; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();