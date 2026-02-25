import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { RefreshCw, Sparkles, Check, Wand2 } from 'lucide-react';

function Analyze() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [applying, setApplying] = useState(false);
    const [selectedName, setSelectedName] = useState('');
    const [customName, setCustomName] = useState('');

    useEffect(() => {
        const analyze = async () => {
            try {
                const res = await axios.post(`http://localhost:3000/api/playlists/${id}/analyze`, {}, {
                    withCredentials: true
                });
                setResult(res.data);
                if (res.data.generatedNames?.length > 0) {
                    setSelectedName(res.data.generatedNames[0]);
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.error || "Failed to analyze playlist.");
            } finally {
                setLoading(false);
            }
        };
        analyze();
    }, [id]);

    const handleApply = async () => {
        const finalName = customName || selectedName;
        if (!finalName) return;

        setApplying(true);
        try {
            await axios.put(`http://localhost:3000/api/playlists/${id}/rename`, {
                newName: finalName,
                vibeLabel: result.vibeLabel
            }, {
                withCredentials: true
            });
            navigate('/export', { state: { finalName, playlist: { length: result.playlistInfo.totalTracks } } });
        } catch (err) {
            console.error(err);
            setError("Failed to apply the new name to Spotify.");
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="container center-content fade-in">
                <div className="loading-state">
                    <RefreshCw size={32} className="spin mb-4 text-primary" />
                    <h2>Running Mathematical Analysis...</h2>
                    <p className="text-muted mt-2">Computing emotional and acoustic vectors.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container center-content fade-in">
                <div className="loading-state">
                    <h2 style={{ color: 'var(--accent-danger)' }}>Analysis Failed</h2>
                    <p className="text-muted mt-2">{error}</p>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/profile')}>Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container fade-in mt-12">
            <header className="app-header mb-8">
                <h2 className="logo" onClick={() => navigate('/')}>Mood Muse</h2>
            </header>

            <div className="naming-layout">
                <div className="naming-controls card">
                    <h3>Analysis Results</h3>

                    <div className="mt-4 mb-4">
                        <p className="text-muted mb-1">Current Name:</p>
                        <h4 style={{ textDecoration: 'line-through', opacity: 0.5 }}>{result.playlistInfo.name}</h4>
                    </div>

                    <div className="vibe-modes mb-6">
                        <div className="btn-vibe active" style={{ cursor: 'default' }}>
                            <Sparkles size={16} className="mr-2 inline" /> {result.vibeLabel}
                        </div>
                    </div>

                    <div className="customizers border-top pt-4">
                        <h4>Acoustic Profile</h4>
                        <div className="mt-4 text-sm text-muted">
                            <div className="flex justify-between mb-2"><span>Tempo</span> <span style={{ color: 'var(--text-primary)' }}>{Math.round(result.aggregateVector.avgTempo)} BPM</span></div>
                            <div className="flex justify-between mb-2"><span>Energy</span> <span style={{ color: 'var(--text-primary)' }}>{(result.aggregateVector.avgEnergy * 100).toFixed(0)}%</span></div>
                            <div className="flex justify-between mb-2"><span>Happiness</span> <span style={{ color: 'var(--text-primary)' }}>{(result.aggregateVector.avgValence * 100).toFixed(0)}%</span></div>
                            <div className="flex justify-between"><span>Danceability</span> <span style={{ color: 'var(--text-primary)' }}>{(result.aggregateVector.avgDanceability * 100).toFixed(0)}%</span></div>
                        </div>
                    </div>
                </div>

                <div className="naming-results">
                    <h3 className="mb-4">AI Curated Replacements</h3>
                    <p className="text-muted mb-6">Select a culturally intelligent name, or type your own based on the vibe.</p>

                    <div className="names-list mb-6">
                        {result.generatedNames.map((n, i) => (
                            <div
                                key={i}
                                className={`name-card bounce-hover ${selectedName === n && !customName ? 'selected-card border-primary' : ''}`}
                                onClick={() => { setSelectedName(n); setCustomName(''); }}
                                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span className="name-input" style={{ background: 'transparent', border: 'none', width: 'auto' }}>{n}</span>
                                {selectedName === n && !customName && <Check size={20} className="text-primary mr-2" />}
                            </div>
                        ))}
                    </div>

                    <div className="control-group mt-4">
                        <label>Custom Name Override:</label>
                        <input
                            type="text"
                            className="search-input w-full"
                            placeholder="Type your own..."
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                        />
                    </div>

                    <div className="mt-8 border-top pt-6 text-right">
                        <button
                            className="btn btn-primary btn-large flex-center"
                            onClick={handleApply}
                            disabled={applying || (!selectedName && !customName)}
                            style={{ marginLeft: 'auto' }}
                        >
                            {applying ? <RefreshCw className="spin mr-2" size={20} /> : <Wand2 size={20} className="mr-2" />}
                            {applying ? 'Applying...' : 'Confirm & Apply to Spotify'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Analyze;
