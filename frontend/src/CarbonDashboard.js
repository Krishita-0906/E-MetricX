import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, PieChart, Pie, Cell } from 'recharts';

const CarbonDashboard = ({ analysisData }) => {
    if (!analysisData || !analysisData.summary) return <p>No Analysis Data Available</p>;

    const { total_emissions, scope1, scope2, scope3, total_sink, net_gap } = analysisData.summary;
    const trendData = analysisData.monthly_data || [];

    const gapData = [
        { name: 'Total Emissions', value: total_emissions, fill: '#ef5350' },
        { name: 'Carbon Sink', value: total_sink, fill: '#66bb6a' },
        { name: 'Net Gap', value: net_gap > 0 ? net_gap : 0, fill: '#ffa726' }
    ];

    const scopeData = [
        { name: 'Scope 1', value: scope1 },
        { name: 'Scope 2', value: scope2 },
        { name: 'Scope 3', value: scope3 || 0 },
    ].filter(s => s.value > 0);

    const COLORS = ['#ff7300', '#1976d2', '#9c27b0']; 

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '350px', marginBottom: '30px' }}>
                <div style={chartBoxStyle}>
                    <h4 style={{textAlign:'center'}}>Gap Analysis (tCO2e)</h4>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={gapData} layout="vertical" margin={{ left: 30, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 12}} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div style={chartBoxStyle}>
                    <h4 style={{textAlign:'center'}}>Emission Sources (Scopes)</h4>
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Pie data={scopeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label>
                                {scopeData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {trendData.length > 0 && (
                <div style={{ ...chartBoxStyle, height: '400px' }}>
                    <h4 style={{textAlign:'center'}}>Activity Trends</h4>
                    <ResponsiveContainer width="100%" height="90%">
                        <ComposedChart data={trendData}>
                            <CartesianGrid stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="year_label" />
                            <YAxis yAxisId="left" orientation="left" stroke="#1976d2" />
                            <YAxis yAxisId="right" orientation="right" stroke="#ff7300" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="electricity_kwh" name="Electricity (kWh)" fill="#1976d2" />
                            <Line yAxisId="right" type="monotone" dataKey="diesel_liters" name="Diesel (L)" stroke="#ff7300" strokeWidth={3} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

const chartBoxStyle = { background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #eee' };
export default CarbonDashboard;