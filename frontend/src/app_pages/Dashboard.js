import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CarbonDashboard from '../CarbonDashboard'; 

const Dashboard = () => {
    const userId = localStorage.getItem('userId');
    const [analysisData, setAnalysisData] = useState(null);
    const [profile, setProfile] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = { headers: { 'X-User-ID': userId } };
                // 1. Get Profile
                const pRes = await axios.get(`http://127.0.0.1:5000/api/get-profile`, config);
                setProfile(pRes.data);

                // 2. Get Cumulative Analysis for ALL datasets
                const dRes = await axios.get(`http://127.0.0.1:5000/api/analyze-all`, config);
                setAnalysisData(dRes.data);
                
            } catch (err) { 
                console.error("Dashboard Error:", err); 
            }
        };
        fetchData();
    }, [userId]);

    if (!analysisData) return <div style={{padding: '50px', textAlign: 'center'}}>Calculating Cumulative Mine Data...</div>;

    return (
        <div style={{ padding: '30px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ color: '#1b5e20', margin: 0 }}>Mine Overview: {profile.mine_name}</h2>
                <p style={{ color: '#666' }}>
                    Viewing cumulative data from <b>{analysisData.metrics.file_count}</b> uploaded reports.
                </p>
            </div>
            
            {/* KPI GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <StatCard title="Cumulative Emissions" value={analysisData.summary.total_emissions} unit="tCO2e" color="#e53935" />
                <StatCard title="Total Carbon Sink" value={analysisData.summary.total_sink} unit="tCO2e" color="#43a047" />
                <StatCard title="Net Gap" value={analysisData.summary.net_gap} unit="tCO2e" color="#fb8c00" />
                <StatCard title="Avg. Intensity" value={analysisData.metrics.per_tonne_coal} unit="t/tonne" color="#1e88e5" />
            </div>

            <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <CarbonDashboard analysisData={analysisData} />
            </div>
        </div>
    );
};

const StatCard = ({ title, value, unit, color }) => (
    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderBottom: `4px solid ${color}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#999', fontSize: '0.8rem', textTransform: 'uppercase' }}>{title}</h4>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333' }}>
            {value?.toLocaleString()} 
            <span style={{ fontSize: '0.8rem', color: '#999', marginLeft: '5px' }}>{unit}</span>
        </div>
    </div>
);

export default Dashboard;