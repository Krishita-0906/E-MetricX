import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, ShieldCheck } from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:5000/api";

const Reports = () => {
    const userId = localStorage.getItem('userId');
    const [datasets, setDatasets] = useState([]);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/user-datasets`, { headers: { 'X-User-ID': userId } })
            .then(res => setDatasets(res.data))
            .catch(err => console.error(err));
    }, [userId]);

    const handleDownload = async (id, filename) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/download-report/${id}`, {
                headers: { 'X-User-ID': userId },
                responseType: 'blob', // IMPORTANT: This tells axios it's a file
            });
            
            // Create a hidden link to force download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Audit_Report_${filename}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Error downloading report.");
        }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ color: '#1b5e20', marginBottom: '10px' }}>📑 Official Reports</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>Generate and download signed audit certificates.</p>

            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                {datasets.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>No data available to report on.</div>
                ) : (
                    datasets.map((d, index) => (
                        <div key={d.dataset_id} style={{ 
                            padding: '20px', 
                            borderBottom: '1px solid #eee', 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: index % 2 === 0 ? '#fff' : '#f9f9f9'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '12px', background: '#e8f5e9', borderRadius: '8px' }}>
                                    <FileText color="#2e7d32" size={24} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333' }}>{d.filename}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#888' }}>Uploaded: {d.upload_date}</div>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleDownload(d.dataset_id, d.filename)}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px 20px', background: '#1976d2', color: 'white', 
                                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                <Download size={18} /> Download PDF
                            </button>
                        </div>
                    ))
                )}
            </div>
            
            <div style={{ marginTop: '30px', textAlign: 'center', color: '#888', fontSize: '0.9rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                <ShieldCheck size={18} color="green" /> 
                All reports are ISO 14064 compliant (Estimate).
            </div>
        </div>
    );
};

export default Reports;