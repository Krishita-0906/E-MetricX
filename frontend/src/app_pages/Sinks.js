import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Sprout, TrendingDown, Target } from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:5000/api";

const Sinks = () => {
    const userId = localStorage.getItem('userId');
    const [datasets, setDatasets] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [data, setData] = useState(null);
    
    // SIMULATOR STATE
    const [addedArea, setAddedArea] = useState(0);

    // 1. Fetch File List
    useEffect(() => {
        axios.get(`${API_BASE_URL}/user-datasets`, { headers: { 'X-User-ID': userId } })
            .then(res => {
                setDatasets(res.data);
                if(res.data.length > 0) setSelectedId(res.data[0].dataset_id);
            });
    }, [userId]);

    // 2. Fetch Analysis
    useEffect(() => {
        if(!selectedId) return;
        setAddedArea(0); // Reset simulator on new file
        axios.get(`${API_BASE_URL}/analyze/${selectedId}`, { headers: { 'X-User-ID': userId } })
            .then(res => setData(res.data))
            .catch(err => console.error(err));
    }, [selectedId, userId]);

    if (!data) return <div style={{padding:'30px'}}>Loading sinks data...</div>;

    // --- CALCULATIONS FOR SIMULATOR ---
    const currentSink = data.summary.total_sink;
    const currentArea = data.mine_profile.area_ha || 1; // Avoid divide by zero
    const sinkFactor = currentSink / currentArea; // tCO2e per Hectare
    
    const simulatedExtraSink = addedArea * sinkFactor;
    const newTotalSink = currentSink + simulatedExtraSink;
    const newGap = data.summary.total_emissions - newTotalSink;
    const percentClosed = Math.min(100, (newTotalSink / data.summary.total_emissions) * 100);

    // --- CHART DATA ---
    const chartData = [
        { name: 'Total Emissions', val: data.summary.total_emissions, fill: '#ef5350' },
        { name: 'Current Sink', val: currentSink, fill: '#66bb6a' },
        { name: 'New Sink (Simulated)', val: newTotalSink, fill: '#2e7d32' }, // Darker Green
    ];

    return (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* HEADER */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#1b5e20' }}>🌱 Sinks & Gap Analysis</h2>
                    <p style={{ color: '#666' }}>Natural Sequestration vs. Carbon Output</p>
                </div>
                <select 
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minWidth:'200px' }}
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                >
                    {datasets.map(d => <option key={d.dataset_id} value={d.dataset_id}>{d.filename}</option>)}
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                
                {/* LEFT: VISUALIZATION */}
                <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>Net Zero Bridge</h4>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize: 12}} />
                            <YAxis />
                            <Tooltip cursor={{fill: 'transparent'}} formatter={(val) => val.toFixed(1) + " tCO₂e"} />
                            <ReferenceLine y={data.summary.total_emissions} label="Net Zero Target" stroke="red" strokeDasharray="3 3" />
                            <Bar dataKey="val" barSize={60} radius={[5, 5, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    
                    <div style={{ textAlign: 'center', marginTop: '20px', padding: '15px', background: newGap <= 0 ? '#e8f5e9' : '#ffebee', borderRadius: '8px' }}>
                        <strong style={{ fontSize: '1.2rem', color: newGap <= 0 ? 'green' : '#c62828' }}>
                            {newGap <= 0 ? "🎉 Net Zero Achieved!" : `Gap: ${newGap.toFixed(1)} tCO₂e`}
                        </strong>
                        {newGap > 0 && <div style={{ fontSize: '0.9rem', color: '#555' }}>You are offseting {percentClosed.toFixed(1)}% of your emissions.</div>}
                    </div>
                </div>

                {/* RIGHT: SIMULATOR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* STAT CARDS */}
                    <div style={cardStyle}>
                        <div style={{ display:'flex', gap:'10px', alignItems:'center', color:'#555', marginBottom:'5px' }}>
                            <Target size={18} /> Current Green Cover
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333' }}>{currentArea} <span style={{fontSize:'1rem'}}>Ha</span></div>
                    </div>

                    <div style={cardStyle}>
                        <div style={{ display:'flex', gap:'10px', alignItems:'center', color:'#555', marginBottom:'5px' }}>
                            <Sprout size={18} /> Sequestration Rate
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333' }}>{sinkFactor.toFixed(1)} <span style={{fontSize:'1rem'}}>t/Ha</span></div>
                    </div>

                    {/* SLIDER CONTROL */}
                    <div style={{ background: '#e0f2f1', padding: '25px', borderRadius: '12px', border: '1px solid #b2dfdb' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#00695c' }}>🧪 Plantation Simulator</h4>
                        <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '20px' }}>
                            What if we expanded our green cover?
                        </p>
                        
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>
                            Add +{addedArea} Hectares
                        </label>
                        <input 
                            type="range" 
                            min="0" max="5000" step="50" 
                            value={addedArea} 
                            onChange={(e) => setAddedArea(Number(e.target.value))}
                            style={{ width: '100%', cursor: 'pointer', accentColor: '#009688' }} 
                        />
                        
                        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #b2dfdb' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem' }}>
                                <span>New Total Sink:</span>
                                <strong>{newTotalSink.toFixed(1)} t</strong>
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginTop:'5px', color: newGap <= 0 ? 'green' : 'red' }}>
                                <span>Resulting Gap:</span>
                                <strong>{newGap <= 0 ? '0' : newGap.toFixed(1)} t</strong>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const cardStyle = { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };

export default Sinks;