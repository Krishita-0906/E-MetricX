import React, { useState } from 'react';
import { Brain, TrendingUp, Sparkles, Info, AlertTriangle, ShieldCheck } from 'lucide-react';

// --- STYLES (Declared first for ESLint and Layout) ---
const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' };
const btnStyle = { backgroundColor: '#1b5e20', color: 'white', border: 'none', padding: '14px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.2s', marginBottom: '20px' };
const sectionHeaderStyle = { display: 'flex', alignItems: 'center', gap: '10px', color: '#1b5e20', marginBottom: '15px', fontWeight: 'bold', fontSize: '1.1rem' };
const pathwayCardStyle = { padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' };
const anomalyCardStyle = { padding: '15px', backgroundColor: '#fff1f2', borderRadius: '10px', borderLeft: '6px solid #b91c1c', marginBottom: '10px' };
const metricBox = { padding: '12px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' };
const insightBox = { padding: '15px', backgroundColor: '#dcfce7', borderRadius: '8px', borderLeft: '4px solid #166534', marginTop: '15px' };
const badgeStyle = (impact) => ({ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', backgroundColor: impact === 'High' || impact === 'HIGH' ? '#dcfce7' : '#fef3c7', color: impact === 'High' || impact === 'HIGH' ? '#166534' : '#92400e', fontWeight: '800', textTransform: 'uppercase' });

const AIAnalytics = () => {
  const [prediction, setPrediction] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(false);

  const historicalData = {
    years: [2021, 2022, 2023, 2024, 2025],
    emissions: [5200, 5000, 4800, 4700, 4500],
    sinks: [800, 950, 1100, 1250, 1400],
    breakdown: { diesel: 62, electricity: 28, other: 10 },
    diesel_usage: [450, 460, 890, 470, 455], 
    elec_usage: [200, 210, 205, 220, 215],
    intensity: 4.2, 
    sink_ratio: 0.28 
  };

  const runFullDiagnostic = async () => {
    setLoading(true);
    try {
      const predRes = await fetch('http://localhost:5000/api/predict-neutrality', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(historicalData)});
      const predData = await predRes.json();
      setPrediction(predData);

      const recRes = await fetch('http://localhost:5000/api/ai-recommendations', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ breakdown: historicalData.breakdown, net_gap: predData.projected_emissions - predData.projected_sink, target_year: predData.neutrality_year })});
      const recData = await recRes.json();
      setRecommendations(recData.ai_pathways);

      const anomRes = await fetch('http://localhost:5000/api/detect-anomalies', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ years: historicalData.years, diesel: historicalData.diesel_usage, electricity: historicalData.elec_usage })});
      const anomData = await anomRes.json();
      setAnomalies(anomData.anomalies);

      const riskRes = await fetch('http://localhost:5000/api/classify-risk', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ intensity: historicalData.intensity, sink_ratio: historicalData.sink_ratio, diesel_dependency: historicalData.breakdown.diesel })});
      const riskData = await riskRes.json();
      setRisk(riskData);
    } catch (err) { console.error("Diagnostic Error:", err); } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* HEADER SECTION */}
      <div>
        <h1 style={{ color: '#1b5e20', display: 'flex', alignItems: 'center', gap: '15px' }}><Brain size={36} /> AI Analytics Intelligence</h1>
        <p style={{ color: '#64748b' }}>Comprehensive machine learning diagnostic suite for E-MetricX.</p>
      </div>

      {/* TOP ROW: FORECAST & PATHWAYS/ANOMALIES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* PHASE 1: FORECAST (Restored Full Detail) */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}><TrendingUp size={20} /> Baseline Carbon Neutrality Forecast</div>
          <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.6', marginBottom: '15px' }}>
            This module applies a <b>machine learning–based linear regression model</b> to historical emissions and carbon sink data to project long-term sustainability outcomes under a <b>no-intervention scenario</b>.
          </p>
          <button onClick={runFullDiagnostic} disabled={loading} style={btnStyle}>{loading ? 'Analyzing...' : 'Run Full AI Diagnostic'}</button>
          
          {prediction && (
            <div style={{ padding: '24px', backgroundColor: '#f0fdf4', borderRadius: '12px', borderLeft: '8px solid #22c55e', borderTop: '1px solid #dcfce7' }}>
              <h3 style={{ color: '#1b5e20', margin: '0 0 10px 0' }}>✅ Projected Neutrality Year: {prediction.neutrality_year}</h3>
              <p style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '20px' }}>
                Based on observed historical trends, the system projects that carbon neutrality will be achieved by {prediction.neutrality_year} if current operational patterns continue unchanged.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={metricBox}><strong>Projected Emissions ({prediction.neutrality_year}):</strong><br/>{prediction.projected_emissions} tCO₂e</div>
                <div style={metricBox}><strong>Projected Carbon Sink ({prediction.neutrality_year}):</strong><br/>{prediction.projected_sink} tCO₂e</div>
              </div>
              <div style={insightBox}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#166534', fontStyle: 'italic' }}>
                  <b>Model Insight:</b> Emissions show a stable trend while carbon sinks increase at a higher rate, leading to convergence around {prediction.neutrality_year}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PATHWAYS & ANOMALIES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* PHASE 2: PATHWAYS */}
          <div style={prediction ? cardStyle : { ...cardStyle, opacity: 0.5 }}>
            <div style={sectionHeaderStyle}><Sparkles size={20} /> AI-Optimized Neutrality Pathways</div>
            {prediction && recommendations.map((rec, i) => (
              <div key={i} style={pathwayCardStyle}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{rec.action}</span>
                    <span style={badgeStyle(rec.impact)}>{rec.impact} Impact</span>
                 </div>
                 <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '8px' }}><b>AI Assessment:</b> {rec.reason}</p>
                 <p style={{ margin: 0, color: '#166534', fontSize: '0.85rem' }}><b>Strategic Note:</b> Targeted mitigation in this sector accelerates neutrality convergence beyond the baseline trend.</p>
              </div>
            ))}
          </div>

          {/* PHASE 3: ANOMALIES */}
          <div style={prediction ? cardStyle : { ...cardStyle, opacity: 0.5 }}>
            <div style={{ ...sectionHeaderStyle, color: '#b91c1c' }}><AlertTriangle size={20} /> AI Risk & Anomaly Monitor</div>
            {prediction && (
              anomalies.length > 0 ? anomalies.map((anom, i) => (
                <div key={i} style={anomalyCardStyle}>
                  <div style={{ fontWeight: 'bold', color: '#b91c1c' }}>⚠️ {anom.type} Detected ({anom.year})</div>
                  <p style={{ fontSize: '0.85rem', margin: '5px 0' }}>{anom.description}</p>
                </div>
              )) : <div style={{ padding: '15px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '8px' }}>✅ Operations stable; no anomalies detected.</div>
            )}
          </div>
        </div>
      </div>

      {/* PHASE 4: FULL WIDTH RISK PROFILE (Bottom Row) */}
      <div style={prediction ? cardStyle : { ...cardStyle, opacity: 0.5 }}>
        <div style={sectionHeaderStyle}><ShieldCheck size={20} /> Sustainability Risk Classification</div>
        {risk ? (
          <div style={{ 
            padding: '24px', 
            borderRadius: '12px', 
            backgroundColor: risk.level === 'HIGH' ? '#fef2f2' : risk.level === 'LOW' ? '#f0fdf4' : '#fffbeb', 
            border: `1px solid ${risk.level === 'HIGH' ? '#fee2e2' : '#dcfce7'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Current Risk Profile</h3>
              <span style={{ ...badgeStyle(risk.level), padding: '6px 16px', fontSize: '0.8rem' }}>{risk.level} RISK</span>
            </div>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: '#334155' }}>{risk.reason}</p>
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px', marginTop: '5px' }}>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                <b>Classification Source:</b> Supervised Decision Tree Analysis based on diesel dependency and sink ratios.
              </p>
            </div>
          </div>
        ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Run baseline diagnostic to generate sustainability classification.</p>}
      </div>
    </div>
  );
};

export default AIAnalytics;