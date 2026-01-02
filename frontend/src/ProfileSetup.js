import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calculator, CheckCircle, Info, ChevronDown, Search } from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:5000/api";

const STATE_RATES = {
    "Jharkhand": 4.5, "Odisha": 5.2, "Chhattisgarh": 6.8, 
    "Madhya Pradesh": 4.0, "Telangana": 3.5, "Maharashtra": 4.2,
    "West Bengal": 4.1, "Uttar Pradesh": 3.8, "Tamil Nadu": 5.0
};
const SPECIES_RATES = {
    "synthetic": "AUTO", "dense_forest": 8.0, "scrub_land": 1.5,
    "bamboo": 12.0, "young_plantation": 3.0, "mixed_forest": 5.5
};

const ProfileSetup = () => {
    const userId = localStorage.getItem('userId');
    const navigate = useNavigate();
    
    const [mines, setMines] = useState([]);
    const [isManual, setIsManual] = useState(false);
    const [previewSink, setPreviewSink] = useState(0);
    
    // Searchable Dropdown State
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [formData, setFormData] = useState({
        selected_mine: '',
        mine_name: '',
        state: 'Jharkhand',
        production: '',
        employees: '',
        area: '',           
        age: '10', 
        plant_type: 'synthetic' 
    });

    useEffect(() => {
        axios.get(`${API_BASE_URL}/get-mine-list`)
            .then(res => setMines(res.data))
            .catch(err => console.error("Failed to load mines", err));
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isManual) return;

        let estArea = parseFloat(formData.area);
        if (!estArea || isNaN(estArea)) {
            const prod = parseFloat(formData.production) || 0;
            estArea = (prod * 0.0001) * 0.20; 
            if (estArea < 5) estArea = 5; 
        }

        let rate = 4.0;
        if (formData.plant_type === 'synthetic') {
            rate = STATE_RATES[formData.state] || 4.0;
        } else {
            rate = SPECIES_RATES[formData.plant_type] || 4.0;
        }

        const age = parseFloat(formData.age) || 10;
        let ageFactor = 1.0;
        if (age < 3) ageFactor = 0.3;
        else if (age < 7) ageFactor = 0.7;

        setPreviewSink(estArea * rate * ageFactor);

    }, [formData, isManual]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMineSelect = (mineName) => {
        setFormData({ ...formData, selected_mine: mineName });
        setSearchTerm(mineName); 
        setIsDropdownOpen(false); 
    };

    const toggleMineStatus = (isNew) => {
        setFormData({ ...formData, age: isNew ? '1' : '10' });
    };

    const handleSubmit = async () => {
        try {
            const payload = isManual ? { ...formData, selected_mine: null } : formData;
            await axios.post(`${API_BASE_URL}/update-profile`, payload, { 
                headers: { 'X-User-ID': userId } 
            });
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || "Error setting up profile.");
        }
    };

    // --- CHANGED LOGIC: Starts With ---
    const filteredMines = mines.filter(mine => 
        mine.toLowerCase().startsWith(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '40px', maxWidth: '700px', margin: '40px auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#1b5e20', marginBottom: '10px' }}>Setup Mine Profile</h2>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>
                Benchmark your emissions and calculate your initial carbon sink.
            </p>
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button 
                    onClick={() => setIsManual(false)}
                    style={{ ...tabStyle, background: !isManual ? '#1b5e20' : '#f5f5f5', color: !isManual ? 'white' : '#666' }}
                >
                    Existing Operational Mine
                </button>
                <button 
                    onClick={() => setIsManual(true)}
                    style={{ ...tabStyle, background: isManual ? '#1b5e20' : '#f5f5f5', color: isManual ? 'white' : '#666' }}
                >
                    New / Unlisted Project
                </button>
            </div>

            {!isManual ? (
                <div style={{ marginBottom: '100px' }}> 
                    <label style={labelStyle}>Search Mine Registry</label>
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text"
                                placeholder="Type to search (e.g. Gevra, Dipka)..."
                                value={searchTerm}
                                onClick={() => setIsDropdownOpen(true)}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setIsDropdownOpen(true);
                                    setFormData({...formData, selected_mine: ''}); 
                                }}
                                style={{ ...inputStyle, paddingRight: '35px' }}
                            />
                            <div style={{ position: 'absolute', right: '10px', top: '10px', color: '#999' }}>
                                {isDropdownOpen ? <Search size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>

                        {isDropdownOpen && (
                            <div style={{ 
                                position: 'absolute', top: '100%', left: 0, right: 0, 
                                maxHeight: '250px', overflowY: 'auto', 
                                background: 'white', border: '1px solid #ccc', 
                                borderRadius: '0 0 8px 8px', zIndex: 1000,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}>
                                {filteredMines.length > 0 ? (
                                    filteredMines.map((m, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => handleMineSelect(m)}
                                            style={{ 
                                                padding: '12px 15px', 
                                                cursor: 'pointer', 
                                                borderBottom: '1px solid #f0f0f0',
                                                fontSize: '0.9rem',
                                                color: '#333',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#e8f5e9'}
                                            onMouseLeave={(e) => e.target.style.background = 'white'}
                                        >
                                            {m}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '15px', color: '#999', textAlign: 'center', fontSize: '0.9rem' }}>
                                        No matches found.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {formData.selected_mine && (
                        <div style={{ marginTop:'15px', padding:'10px', background:'#e8f5e9', color:'#1b5e20', borderRadius:'6px', display:'flex', alignItems:'center', gap:'8px', fontSize:'0.9rem' }}>
                            <CheckCircle size={16} /> Selected: <strong>{formData.selected_mine}</strong>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px' }}>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        <input name="mine_name" placeholder="Mine Name" onChange={handleChange} style={inputStyle} />
                        
                        <div>
                            <label style={labelStyle}>State (Climate Zone)</label>
                            <select name="state" onChange={handleChange} style={inputStyle}>
                                <option value="Jharkhand">Jharkhand (4.5 t/ha)</option>
                                <option value="Odisha">Odisha (5.2 t/ha)</option>
                                <option value="Chhattisgarh">Chhattisgarh (6.8 t/ha)</option>
                                <option value="Madhya Pradesh">Madhya Pradesh (4.0 t/ha)</option>
                                <option value="Telangana">Telangana (3.5 t/ha)</option>
                                <option value="Maharashtra">Maharashtra (4.2 t/ha)</option>
                                <option value="West Bengal">West Bengal (4.1 t/ha)</option>
                                <option value="Uttar Pradesh">Uttar Pradesh (3.8 t/ha)</option>
                                <option value="Tamil Nadu">Tamil Nadu (5.0 t/ha)</option>
                            </select>
                        </div>

                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                            <input name="production" type="number" placeholder="Prod. (TPA)" onChange={handleChange} style={inputStyle} />
                            <input name="employees" type="number" placeholder="Employees" onChange={handleChange} style={inputStyle} />
                        </div>
                        
                        <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                <label style={{...labelStyle, fontSize:'0.85rem'}}>Green Cover Details</label>
                                <div style={{display:'flex', gap:'5px', fontSize:'0.7rem'}}>
                                    <span 
                                        onClick={() => toggleMineStatus(false)}
                                        style={{cursor:'pointer', color: parseFloat(formData.age) >= 7 ? '#1b5e20' : '#999', fontWeight:'bold'}}
                                    >Mature</span>
                                    |
                                    <span 
                                        onClick={() => toggleMineStatus(true)}
                                        style={{cursor:'pointer', color: parseFloat(formData.age) < 3 ? '#ef6c00' : '#999', fontWeight:'bold'}}
                                    >New</span>
                                </div>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                                <input name="area" type="number" placeholder="Area (Ha)" onChange={handleChange} style={inputStyle} />
                                <input name="age" type="number" value={formData.age} placeholder="Age (Yrs)" onChange={handleChange} style={inputStyle} />
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '12px', border: '1px solid #c8e6c9', height: 'fit-content' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#1b5e20', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calculator size={18} /> Est. Sink
                        </h4>
                        
                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1b5e20' }}>
                                {previewSink.toFixed(1)}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#555' }}>tonnes CO₂e / year</div>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: '#666', lineHeight: '1.4' }}>
                            {parseFloat(formData.age) >= 7 ? (
                                <p style={{ display: 'flex', gap: '8px', marginBottom: '8px', color: '#1b5e20' }}>
                                    <CheckCircle size={14} /> 
                                    <strong>Mature Mine:</strong> Full sequestration credit applied (100%).
                                </p>
                            ) : (
                                <p style={{ color: '#c62828', background: '#ffebee', padding: '5px', borderRadius: '4px' }}>
                                    <Info size={12} style={{marginRight:'4px'}}/>
                                    <strong>Developing Site:</strong> Young trees absorb less CO₂ (30% factor).
                                </p>
                            )}
                            <p style={{ marginTop:'10px', fontSize:'0.75rem', color:'#888'}}>
                                Based on {formData.state} climate data.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <button onClick={handleSubmit} style={btnStyle}>Confirm & Save Profile</button>
        </div>
    );
};

// Styles
const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '0.95rem', outline: 'none' };
const tabStyle = { flex: 1, padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: '0.2s', border: '1px solid #eee' };
const btnStyle = { width: '100%', padding: '14px', marginTop: '30px', background: '#1b5e20', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'background 0.2s' };
const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '600', color: '#444', fontSize: '0.9rem' };

export default ProfileSetup;