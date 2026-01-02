import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE_URL = "http://127.0.0.1:5000/api";
const COLORS = ['#FF8042', '#0088FE', '#FFBB28', '#00C49F']; // Colors for Pie Chart

const Emissions = () => {
    const userId = localStorage.getItem('userId');
    const [datasets, setDatasets] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [data, setData] = useState(null);

    // 1. Fetch File List
    useEffect(() => {
        axios.get(`${API_BASE_URL}/user-datasets`, { headers: { 'X-User-ID': userId } })
            .then(res => {
                setDatasets(res.data);
                if(res.data.length > 0) setSelectedId(res.data[0].dataset_id); // Auto-select first
            });
    }, [userId]);

    // 2. Fetch Breakdown when selection changes
    useEffect(() => {
        if(!selectedId) return;
        axios.get(`${API_BASE_URL}/emissions-breakdown/${selectedId}`, { headers: { 'X-User-ID': userId } })
            .then(res => setData(res.data))
            .catch(err => console.error(err));
    }, [selectedId, userId]);

    if (!data) return <div style={{padding:'30px'}}>Loading analysis...</div>;

    return (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* HEADER & CONTROLS */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#1b5e20' }}>🏭 Emissions Breakdown</h2>
                    <p style={{ color: '#666' }}>Detailed analysis by Source and Scope</p>
                </div>
                <select 
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minWidth:'200px' }}
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                >
                    {datasets.map(d => <option key={d.dataset_id} value={d.dataset_id}>{d.filename}</option>)}
                </select>
            </div>

            {/* DIAGNOSIS BOX */}
            <div style={{ background: '#e3f2fd', borderLeft: '5px solid #2196f3', padding: '15px', borderRadius: '5px', marginBottom: '30px' }}>
                <strong style={{ color: '#0d47a1' }}>💡 Diagnosis:</strong> <span style={{color:'#333'}}>{data.diagnosis}</span>
            </div>

            {/* KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <Card title="Total Emissions" value={data.kpis.total_emissions} unit="tCO₂e" />
                <Card title="Intensity (Production)" value={data.kpis.intensity_coal} unit="tCO₂e / Tonne" />
                <Card title="Intensity (Employee)" value={data.kpis.intensity_emp} unit="tCO₂e / Person" />
                <Card title="Scope 1 Share" value={((data.kpis.scope1 / data.kpis.total_emissions)*100).toFixed(1)} unit="% of Total" />
            </div>

            {/* CHARTS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                
                {/* CHART 1: ACTIVITY MIX (PIE) */}
                <div style={chartBoxStyle}>
                    <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>Activity Contribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={data.breakdowns.activity_mix} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {data.breakdowns.activity_mix.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* CHART 2: SCOPE SPLIT (BAR) */}
                <div style={chartBoxStyle}>
                    <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>Scope 1 vs Scope 2</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.breakdowns.scope_split}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#2e7d32" barSize={50} name="Emissions (tCO₂e)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// Styles
const Card = ({ title, value, unit }) => (
    <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign:'center' }}>
        <div style={{ fontSize: '0.85rem', color: '#888', textTransform:'uppercase', fontWeight:'bold' }}>{title}</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333', margin:'10px 0' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>{unit}</div>
    </div>
);

const chartBoxStyle = { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };

export default Emissions;