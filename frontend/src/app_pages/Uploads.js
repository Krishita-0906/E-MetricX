// src/app_pages/Uploads.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:5000/api";

const Uploads = () => {
    const userId = localStorage.getItem('userId');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = () => {
        axios.get(`${API_BASE_URL}/user-datasets`, { headers: { 'X-User-ID': userId } })
            .then(res => setExistingFiles(res.data))
            .catch(err => console.error(err));
    };

    const handleFileSelect = (event) => {
        if (event.target.files) {
            setSelectedFiles(Array.from(event.target.files)); 
            setMessage(null);
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true);
        setMessage(null);

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            const res = await axios.post(`${API_BASE_URL}/upload-data`, formData, {
                headers: { 'X-User-ID': userId, 'Content-Type': 'multipart/form-data' }
            });
            // Success Message
            setMessage({ type: 'success', text: res.data.message });
            setSelectedFiles([]); 
            fetchFiles(); 
        } catch (err) {
            // Error Message (Displaying the "blocked" reason from backend)
            const errorMsg = err.response?.data?.message || "Upload failed.";
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Are you sure you want to delete this file? This cannot be undone.")) return;

        try {
            await axios.delete(`${API_BASE_URL}/delete-dataset/${id}`, {
                headers: { 'X-User-ID': userId }
            });
            fetchFiles(); // Refresh list immediately
            setMessage({ type: 'success', text: "File deleted successfully." });
        } catch (err) {
            alert("Delete failed: " + err.message);
        }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom:'20px' }}>
                <h2 style={{ color: '#1b5e20', margin:0 }}>📂 Data Management</h2>
                <p style={{ color: '#666', marginTop:'5px' }}></p>
            </div>

            {/* UPLOAD BOX */}
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center', border: '2px dashed #ccc' }}>
                <UploadCloud size={48} color="#2e7d32" style={{ marginBottom: '15px' }} />
                <h3 style={{ margin: '0 0 10px 0' }}>Drag & Drop or Click to Upload</h3>
                
                <input type="file" id="fileInput" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
                <label htmlFor="fileInput" style={{ background: '#2e7d32', color: 'white', padding: '12px 30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {selectedFiles.length > 0 ? `Selected ${selectedFiles.length} File(s)` : "Choose Files"}
                </label>

                {selectedFiles.length > 0 && (
                    <div style={{ marginTop: '20px', textAlign: 'left', background: '#f5f7fa', padding: '15px', borderRadius: '8px' }}>
                        <strong style={{ display: 'block', marginBottom: '10px' }}>Ready to Upload:</strong>
                        {selectedFiles.map((f, i) => <div key={i}>📄 {f.name}</div>)}
                        <button onClick={handleUpload} disabled={uploading} style={{ width: '100%', marginTop: '15px', padding: '12px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {uploading ? "Uploading..." : "Confirm Upload"}
                        </button>
                    </div>
                )}
            </div>

            {/* ALERT MESSAGES */}
            {message && (
                <div style={{ marginTop: '20px', padding: '15px', borderRadius: '6px', background: message.type === 'success' ? '#e8f5e9' : '#ffebee', color: message.type === 'success' ? '#2e7d32' : '#c62828', display:'flex', alignItems:'center', gap:'10px', border: `1px solid ${message.type === 'success' ? '#a5d6a7' : '#ef9a9a'}` }}>
                    {message.type === 'success' ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
                    <strong>{message.text}</strong>
                </div>
            )}

            {/* FILE LIST (With Delete) */}
            <h3 style={{ marginTop: '40px', color: '#444' }}>📚 Upload History</h3>
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                {existingFiles.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>No files found.</div>
                ) : (
                    existingFiles.map((file, index) => (
                        <div key={index} style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <FileText color="#555" size={20} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{file.filename}</div>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>Uploaded: {file.upload_date}</div>
                            </div>
                            
                            {/* DELETE BUTTON */}
                            <button 
                                onClick={() => handleDelete(file.dataset_id)}
                                style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', transition: '0.2s' }}
                                title="Delete File"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Uploads;