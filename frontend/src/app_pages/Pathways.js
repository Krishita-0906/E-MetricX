import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Settings, Leaf, Sun, Truck, Target } from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:5000/api";

const Pathways = () => {
    const userId = localStorage.getItem('userId');
    const [datasets, setDatasets] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [baseData, setBaseData] = useState(null);

    // SCENARIO SLIDERS (The "What-If" Variables)
    const [dieselRed, setDieselRed] = useState(0);   // % reduction
    const [solarShare, setSolarShare] = useState(0); // % renewable energy
    const [addedTrees, setAddedTrees] = useState(0); // Hectares

    // TARGET
    const [targetYear, setTargetYear] = useState(2030);

    // 1. Load Files
    useEffect(() => {
        axios.get(`${API_BASE_URL}/user-datasets`, { headers: { 'X-User-ID': userId } })
            .then(res => {
                setDatasets(res.data);
                if(res.data.length > 0) setSelectedId(res.data[0].dataset_id);
            });
    }, [userId]);

    // 2. Load Baseline Data
    useEffect(() => {
        if(!selectedId) return;
        axios.get(`${API_BASE_URL}/analyze/${selectedId}`, { headers: { 'X-User-ID': userId } })
            .then(res => setBaseData(res.data))
            .catch(err => console.error(err));
    }, [selectedId, userId]);

    if (!baseData) return <div style={{padding:'30px'}}>Loading scenario engine...</div>;

    // --- THE MATH ENGINE ---
    const b = baseData.summary;
    const p = baseData.mine_profile;
    
    // 1. Calculate New Scope 1 (Diesel Reduction)
    const newScope1 = b.scope1 * (1 - (dieselRed / 100));
    
    // 2. Calculate New Scope 2 (Solar Replacement - assuming Solar is near 0 emission)
    const newScope2 = b.scope2 * (1 - (solarShare / 100));
    
    // 3. Calculate New Sink (Added Area)
    // Sequestration Factor = Current Sink / Current Area
    const currentArea = p.area_ha || 1; 
    const seqFactor = b.total_sink / currentArea; 
    const newSink = b.total_sink + (addedTrees * seqFactor);

    // 4. Net Results
    const newTotal = newScope1 + newScope2;
    const newGap = newTotal - newSink;
    
    // Chart Data Preparation (Baseline vs Target vs Scenario)
    const chartData = [
        { name: 'Baseline (Today)', emissions: b.total_emissions, sink: b.total_sink, net: b.net_gap },
        { name: `Scenario (${targetYear})`, emissions: newTotal, sink: newSink, net: newGap > 0 ? newGap : 0 },
    ];

    return (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* HEADER */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#1b5e20' }}>🚀 Neutrality Pathways</h2>
                    <p style={{ color: '#666' }}>Plan your route to Net Zero</p>
                </div>
                <select 
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minWidth:'200px' }}
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                >
                    {datasets.map(d => <option key={d.dataset_id} value={d.dataset_id}>{d.filename}</option>)}
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                
                {/* LEFT: CONTROL PANEL */}
                <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height:'fit-content' }}>
                    <h4 style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:0, color:'#444' }}>
                        <Settings size={18} /> Intervention Controls
                    </h4>
                    
                    {/* Control 1: Diesel */}
                    <div style={controlBox}>
                        <label style={labelStyle}><Truck size={16}/> Fleet Electrification</label>
                        <input type="range" min="0" max="100" value={dieselRed} onChange={e=>setDieselRed(e.target.value)} style={sliderStyle} />
                        <div style={valStyle}>Reduce Diesel by {dieselRed}%</div>
                    </div>

                    {/* Control 2: Solar */}
                    <div style={controlBox}>
                        <label style={labelStyle}><Sun size={16}/> Renewable Energy</label>
                        <input type="range" min="0" max="100" value={solarShare} onChange={e=>setSolarShare(e.target.value)} style={sliderStyle} />
                        <div style={valStyle}>Switch {solarShare}% to Solar</div>
                    </div>

                    {/* Control 3: Trees */}
                    <div style={controlBox}>
                        <label style={labelStyle}><Leaf size={16}/> Afforestation</label>
                        <input type="range" min="0" max="5000" step="50" value={addedTrees} onChange={e=>setAddedTrees(e.target.value)} style={sliderStyle} />
                        <div style={valStyle}>Plant +{addedTrees} Ha</div>
                    </div>

                    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                         <label style={labelStyle}><Target size={16}/> Target Year</label>
                         <select value={targetYear} onChange={e=>setTargetYear(e.target.value)} style={{width:'100%', padding:'8px', marginTop:'5px'}}>
                             <option value="2025">2025</option>
                             <option value="2030">2030</option>
                             <option value="2040">2040</option>
                             <option value="2050">2050</option>
                         </select>
                    </div>
                </div>

                {/* RIGHT: RESULTS VISUALIZATION */}
                <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                    
                    {/* 1. STATUS BANNER */}
                    <div style={{ 
                        background: newGap <= 0 ? '#e8f5e9' : '#fff3e0', 
                        borderLeft: `5px solid ${newGap <= 0 ? '#2e7d32' : '#ef6c00'}`,
                        padding: '20px', borderRadius: '8px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div>
                            <h3 style={{ margin: 0, color: newGap <= 0 ? '#2e7d32' : '#ef6c00' }}>
                                {newGap <= 0 ? "Target Achieved! 🏆" : "Target Missed ⚠️"}
                            </h3>
                            <p style={{ margin: '5px 0 0 0', color: '#555' }}>
                                {newGap <= 0 
                                    ? `You will be Carbon Neutral by ${targetYear} with a surplus of ${Math.abs(newGap).toFixed(0)} tons.` 
                                    : `You still have a gap of ${newGap.toFixed(0)} tCO₂e to close.`}
                            </p>
                        </div>
                        <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:'0.8rem', color:'#888' }}>Projected Net Emissions</div>
                            <div style={{ fontSize:'2rem', fontWeight:'bold', color:'#333' }}>{newGap <= 0 ? 0 : newGap.toFixed(0)}</div>
                        </div>
                    </div>

                    {/* 2. MAIN CHART */}
                    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flex:1 }}>
                        <ResponsiveContainer width="100%" height={350}>
                            <ComposedChart data={chartData} margin={{top:20, right:30, bottom:0, left:0}}>
                                <CartesianGrid stroke="#f5f5f5" />
                                <XAxis dataKey="name" fontWeight="bold" />
                                <YAxis />
                                <Tooltip cursor={{fill:'transparent'}} />
                                <Legend />
                                <Bar dataKey="emissions" name="Total Emissions" fill="#ef5350" barSize={50} />
                                <Bar dataKey="sink" name="Carbon Sink" fill="#66bb6a" barSize={50} />
                                <Line type="monotone" dataKey="net" name="Net Gap" stroke="#ff9800" strokeWidth={3} dot={{r:6}} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* 3. IMPACT SUMMARY */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px' }}>
                        <StatCard label="Diesel Savings" value={`${(b.scope1 - newScope1).toFixed(0)} t`} color="#1976d2" />
                        <StatCard label="Solar Savings" value={`${(b.scope2 - newScope2).toFixed(0)} t`} color="#fbc02d" />
                        <StatCard label="New Sequestration" value={`+${(newSink - b.total_sink).toFixed(0)} t`} color="#2e7d32" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Styles
const controlBox = { marginBottom: '20px' };
const labelStyle = { display: 'flex', gap:'8px', alignItems:'center', fontWeight: 'bold', marginBottom: '8px', color: '#555', fontSize:'0.9rem' };
const sliderStyle = { width: '100%', cursor: 'pointer', accentColor: '#2e7d32' };
const valStyle = { fontSize: '0.85rem', color: '#2e7d32', fontWeight: 'bold', marginTop: '4px', textAlign:'right' };

const StatCard = ({ label, value, color }) => (
    <div style={{ background:'white', padding:'15px', borderRadius:'8px', borderTop:`3px solid ${color}`, textAlign:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize:'0.8rem', color:'#888' }}>{label}</div>
        <div style={{ fontSize:'1.2rem', fontWeight:'bold', color:color }}>{value}</div>
    </div>
);

export default Pathways;