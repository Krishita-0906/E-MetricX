import React from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, PieChart, Pie, Cell
} from 'recharts';

const CarbonDashboard = ({ analysisData }) => {
  if (!analysisData || !analysisData.monthly_data) return <p style={{textAlign:'center', padding:'20px'}}>No Analysis Data Available</p>;

  const trendData = analysisData.monthly_data;
  const { total_emissions, scope1, scope2, total_sink, net_gap } = analysisData.summary;

  // 1. GAP ANALYSIS DATA
  const gapData = [
    { name: 'Total Emissions', value: total_emissions, fill: '#ef5350' }, // Red
    { name: 'Carbon Sink', value: total_sink, fill: '#66bb6a' },          // Green
    { name: 'Remaining Gap', value: net_gap > 0 ? net_gap : 0, fill: '#ffa726' } // Orange
  ];

  // 2. SCOPE SPLIT DATA
  const scopeData = [
    { name: 'Scope 1 (Diesel)', value: scope1 },
    { name: 'Scope 2 (Electricity)', value: scope2 },
  ];
  const COLORS = ['#ff7300', '#1976d2']; 

  // Format large numbers (e.g. 1500000 -> 1.5M)
  const formatYAxis = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value;
  };

  return (
    <div style={{ marginTop: '20px' }}>
      
      {/* --- ROW 1: BREAKDOWN CHARTS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        
        {/* CHART 1: GAP ANALYSIS (Cleaned Up) */}
        <div style={chartContainerStyle}>
            <h4 style={chartTitleStyle}>📉 Cumulative Gap Analysis</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={gapData} 
                    layout="vertical" 
                    margin={{ top: 20, right: 60, left: 40, bottom: 20 }} // <-- Added Right Margin for Labels
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
                    <XAxis type="number" hide />
                    
                    {/* Fixed width ensures "Total Emissions" fits on one line */}
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={110} 
                        tick={{fontSize:'13px', fontWeight:'600', fill:'#444'}} 
                    />
                    
                    <Tooltip cursor={{fill: '#f5f5f5'}} formatter={(val) => val.toLocaleString()} />
                    
                    <Bar dataKey="value" barSize={35} radius={[0, 6, 6, 0]}>
                        {gapData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        {/* Value Label on the right of the bar */}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* CHART 2: SCOPE SPLIT */}
        <div style={chartContainerStyle}>
            <h4 style={chartTitleStyle}>🔥 Scope Split</h4>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie 
                        data={scopeData} 
                        cx="50%" cy="50%" 
                        innerRadius={65} 
                        outerRadius={90} 
                        paddingAngle={5} 
                        dataKey="value"
                        label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                    >
                        {scopeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(val) => val.toLocaleString() + " tCO₂e"} />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* --- ROW 2: YEARLY TRENDS (Cleaned Up) --- */}
      <div style={{ ...chartContainerStyle, height: '450px' }}>
        <h4 style={chartTitleStyle}>Yearly Activity Trends</h4>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={trendData} 
            margin={{ top: 30, right: 50, left: 50, bottom: 30 }} // <-- Extra side margins for axes
          >
            <CartesianGrid stroke="#f0f0f0" vertical={false} />
            
            <XAxis 
                dataKey="year_label" 
                tick={{fontSize: 13, fontWeight: 'bold'}} 
                axisLine={{ stroke: '#e0e0e0' }}
            />
            
            {/* Left Axis: Electricity (Blue) */}
            <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke="#1976d2" 
                tickFormatter={formatYAxis}
                label={{ value: 'Electricity (kWh)', angle: -90, position: 'insideLeft', offset: -35, style: {fill: '#1976d2'} }} 
            />
            
            {/* Right Axis: Diesel (Orange) */}
            <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#ff7300" 
                tickFormatter={formatYAxis}
                label={{ value: 'Diesel (Liters)', angle: 90, position: 'insideRight', offset: -35, style: {fill: '#ff7300'} }} 
            />
            
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                formatter={(value) => new Intl.NumberFormat('en-IN').format(value)} 
            />
            <Legend verticalAlign="top" height={40}/>
            
            <Bar yAxisId="left" dataKey="electricity_kwh" name="Electricity" fill="#1976d2" barSize={50} radius={[6, 6, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="diesel_liters" name="Diesel" stroke="#ff7300" strokeWidth={4} dot={{r:5, strokeWidth:2, fill:'white'}} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- STYLES ---
const chartContainerStyle = {
    height: '350px', 
    backgroundColor: 'white', 
    padding: '25px', 
    borderRadius: '12px', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    border: '1px solid #f0f0f0'
};

const chartTitleStyle = {
    textAlign: 'center', 
    margin: '0 0 20px 0', 
    color: '#333',
    fontSize: '1.1rem'
};

export default CarbonDashboard;