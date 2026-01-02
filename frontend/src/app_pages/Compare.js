import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckSquare, Square } from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:5000/api";
// Professional color palette for up to 10 years
const COLORS = ['#1976d2', '#2e7d32', '#f57c00', '#c62828', '#7b1fa2', '#0097a7', '#5d4037', '#689f38'];

const Compare = () => {
    const userId = localStorage.getItem('userId');
    const [datasets, setDatasets] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]); // Array instead of single IDs
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. Fetch File List
    useEffect(() => {
        axios.get(`${API_BASE_URL}/user-datasets`, { headers: { 'X-User-ID': userId } })
            .then(res => setDatasets(res.data))
            .catch(err => console.error(err));
    }, [userId]);

    // 2. Toggle Selection
    const toggleSelection = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id)); // Uncheck
        } else {
            setSelectedIds([...selectedIds, id]); // Check
        }
    };

    // 3. Run Multi-Analysis
    const handleCompare = async () => {
        if (selectedIds.length < 2) return alert("Please select at least 2 years to compare.");
        
        setLoading(true);
        try {
            // Run ALL requests in parallel
            const promises = selectedIds.map(id => 
                axios.get(`${API_BASE_URL}/analyze/${id}`, { headers: { 'X-User-ID': userId } })
            );
            
            const results = await Promise.all(promises);
            
            // Format Data for Recharts: Group by Category (Total, Scope 1, Scope 2)
            // We need a structure like: { name: 'Total Emissions', '2021 File': 500, '2022 File': 600 }
            
            const categories = [
                { key: 'total_emissions', label: 'Total Emissions' },
                { key: 'scope1', label: 'Scope 1 (Diesel)' },
                { key: 'scope2', label: 'Scope 2 (Elec)' },
                { key: 'net_gap', label: 'Net Gap' }
            ];

            const builtData = categories.map(cat => {
                let row = { name: cat.label };
                results.forEach((res, index) => {
                    // Find the filename for this dataset
                    const originalId = selectedIds[index];
                    const meta = datasets.find(d => d.dataset_id === originalId);
                    const label = meta ? meta.filename : `File ${index+1}`;
                    
                    // Add the value to the row
                    row[label] = res.data.summary[cat.key];
                });
                return row;
            });

            setChartData(builtData);

        } catch (error) {
            console.error(error);
            alert("Error analyzing files.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ color: '#1b5e20', marginBottom: '10px' }}>📊 Multi-Year Trends</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>Select multiple files to analyze historical performance.</p>

            {/* 1. SELECTION PANEL (Checkboxes) */}
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Select Datasets ({selectedIds.length} selected)</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    {datasets.map(d => (
                        <div 
                            key={d.dataset_id} 
                            onClick={() => toggleSelection(d.dataset_id)}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', 
                                border: selectedIds.includes(d.dataset_id) ? '1px solid #2e7d32' : '1px solid #eee',
                                background: selectedIds.includes(d.dataset_id) ? '#e8f5e9' : 'white',
                                borderRadius: '6px', cursor: 'pointer', transition: '0.2s'
                            }}
                        >
                            {selectedIds.includes(d.dataset_id) ? <CheckSquare size={20} color="#2e7d32" /> : <Square size={20} color="#ccc" />}
                            <span style={{ fontWeight: selectedIds.includes(d.dataset_id) ? 'bold' : 'normal' }}>{d.filename}</span>
                        </div>
                    ))}
                </div>

                <button onClick={handleCompare} disabled={loading} style={btnStyle}>
                    {loading ? 'Crunching Numbers...' : 'Generate Comparison'}
                </button>
            </div>

            {/* 2. DYNAMIC CHART */}
            {chartData.length > 0 && (
                <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', animation: 'fadeIn 0.5s' }}>
                    <h4 style={{ textAlign: 'center', marginBottom: '30px', color: '#444' }}>Historical Comparison</h4>
                    <ResponsiveContainer width="100%" height={450}>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{fontWeight:'bold'}} />
                            <YAxis />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Legend />
                            
                            {/* DYNAMIC BARS: We generate one bar per selected file */}
                            {selectedIds.map((id, index) => {
                                const meta = datasets.find(d => d.dataset_id === id);
                                const label = meta ? meta.filename : `File ${index+1}`;
                                return (
                                    <Bar 
                                        key={id} 
                                        dataKey={label} 
                                        fill={COLORS[index % COLORS.length]} 
                                        radius={[4, 4, 0, 0]} 
                                    />
                                );
                            })}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

const btnStyle = { padding: '12px 30px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' };

export default Compare;