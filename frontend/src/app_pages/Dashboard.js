import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CarbonDashboard from '../CarbonDashboard'; 

const API_BASE_URL = "http://127.0.0.1:5000/api";

const Dashboard = () => {
    const userId = localStorage.getItem('userId');
    const [profile, setProfile] = useState({});
    const [analysisData, setAnalysisData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get Profile
                const pRes = await axios.get(`${API_BASE_URL}/get-profile`, { headers: { 'X-User-ID': userId } });
                setProfile(pRes.data);

                // 2. NEW: Get AGGREGATED Analysis (All Files)
                const dRes = await axios.get(`${API_BASE_URL}/analyze-all`, { headers: { 'X-User-ID': userId } });
                setAnalysisData(dRes.data);
                
            } catch (error) { console.error(error); }
        };
        fetchData();
    }, [userId]);

    return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* WELCOME HEADER */}
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: 0, color: '#1b5e20' }}>Overview</h1>
                <p style={{ color: '#666' }}>
                    Welcome back, <strong>{profile.mine_name || 'User'}</strong>. 
                    Viewing cumulative data across <strong>{analysisData?.metrics?.file_count || 0}</strong> reports.
                </p>
            </div>

            {/* KEY STATS CARDS */}
            {analysisData ? (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                        {/* Note: Labels changed to indicate "Lifetime" or "Total" */}
                        <Card title="Emissions" value={analysisData.summary.total_emissions} unit="tCO₂e" color="#c62828" />
                        <Card title="Sink" value={analysisData.summary.total_sink} unit="tCO₂e" color="#2e7d32" />
                        <Card title="Cumulative Net Gap" value={analysisData.summary.net_gap} unit="tCO₂e" color={analysisData.summary.net_gap > 0 ? "#f57c00" : "#00acc1"} />
                        <Card title="Avg. Intensity" value={analysisData.metrics.per_tonne_coal} unit="tCO₂e/t" color="#546e7a" />
                    </div>
                    
                    {/* CHARTS */}
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        {/* Reuse the existing chart component, it adapts to the data format automatically */}
                        <CarbonDashboard analysisData={analysisData} />
                    </div>
                </>
            ) : (
                <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px' }}>
                    <h3>No Data Available</h3>
                    <p>Go to the <strong>Data & Uploads</strong> tab to add your first audit file.</p>
                </div>
            )}
        </div>
    );
};

// Simple Internal Card Component
const Card = ({ title, value, unit, color }) => (
    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', borderLeft: `5px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#888', fontSize: '0.9rem', textTransform: 'uppercase' }}>{title}</h4>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{unit}</div>
    </div>
);

export default Dashboard;