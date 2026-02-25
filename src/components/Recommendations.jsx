import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, RefreshCw } from 'lucide-react';
import { getRecommendations } from '../services/spotify';

function Recommendations({ seedTrack, playlist, setPlaylist }) {
    const navigate = useNavigate();

    const [chaos, setChaos] = useState(50);
    const [underground, setUnderground] = useState(30);
    const [villain, setVillain] = useState(false);
    const [feminine, setFeminine] = useState(false);
    const [era, setEra] = useState('Mixed');

    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTracks = async () => {
        if (!seedTrack) {
            navigate('/');
            return;
        }

        setLoading(true);
        const resultTracks = await getRecommendations(seedTrack.id, chaos, underground, villain, feminine);
        setTracks(resultTracks);
        setLoading(false);
    };

    useEffect(() => {
        fetchTracks();
    }, [chaos, underground, villain, feminine, era, seedTrack]);

    const toggleTrack = (track) => {
        if (playlist.find(t => t.id === track.id)) {
            setPlaylist(playlist.filter(t => t.id !== track.id));
        } else {
            setPlaylist([...playlist, track]);
        }
    };

    return (
        <div className="container fade-in">
            <header className="app-header mt-12">
                <h2 className="logo" onClick={() => navigate('/')}>Mood Muse</h2>
                <div className="header-stats">
                    <span>{playlist.length} tracks selected</span>
                </div>
            </header>
            <div className="layout-grid">
                <aside className="controls-sidebar card">
                    <h3>Vibe Tuners</h3>
                    <p className="text-muted mb-4 text-sm">Seed: <strong className="text-main">{seedTrack?.name || 'Unknown'}</strong></p>

                    <div className="control-group">
                        <label>Make it more chaotic</label>
                        <input type="range" min="0" max="100" value={chaos} onChange={e => setChaos(Number(e.target.value))} className="vibe-slider" />
                    </div>
                    <div className="control-group">
                        <label>More underground</label>
                        <input type="range" min="0" max="100" value={underground} onChange={e => setUnderground(Number(e.target.value))} className="vibe-slider" />
                    </div>
                    <div className="control-group toggle-group mt-4">
                        <label>Villain Arc Energy</label>
                        <input type="checkbox" checked={villain} onChange={e => setVillain(e.target.checked)} className="custom-toggle" />
                    </div>
                    <div className="control-group toggle-group">
                        <label>More feminine energy</label>
                        <input type="checkbox" checked={feminine} onChange={e => setFeminine(e.target.checked)} className="custom-toggle" />
                    </div>
                    <div className="control-group mt-4">
                        <label>Era Selector</label>
                        <select className="vibe-select" value={era} onChange={e => setEra(e.target.value)}>
                            <option>Mixed</option>
                            <option>2000s</option>
                            <option>2010s</option>
                            <option>Current</option>
                        </select>
                    </div>
                </aside>

                <main className="results-area">
                    <div className="flex justify-between items-center mb-6">
                        <h3>Recommended Tracks</h3>
                        <button className="btn btn-secondary btn-sm flex-center" onClick={fetchTracks}>
                            <RefreshCw size={16} className={`mr-2 ${loading ? 'spin' : ''}`} /> Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <RefreshCw size={28} className="spin" />
                            <p>Curating the vibe...</p>
                        </div>
                    ) : (
                        <div className="track-grid">
                            {tracks.map((track) => {
                                const isAdded = !!playlist.find(t => t.id === track.id);
                                return (
                                    <div key={track.id} className={`track-card bounce-hover ${isAdded ? 'selected-card' : ''}`}>
                                        <div className="track-info">
                                            <h4>{track.name}</h4>
                                            <p>{track.artist}</p>
                                        </div>
                                        <div className="track-meta">
                                            <span className="tag">{track.tag}</span>
                                            <span className="similarity">{track.similarity}% match</span>
                                        </div>
                                        <button
                                            className={`btn btn-sm w-full flex-center ${isAdded ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => toggleTrack(track)}
                                        >
                                            {isAdded ? <Check size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
                                            {isAdded ? 'Added' : 'Add to Mix'}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className="action-footer mt-8 border-top pt-6 flex justify-between items-center">
                        <p className="text-muted">{playlist.length} tracks ready for their era.</p>
                        <button
                            className="btn btn-primary btn-large flex-center"
                            onClick={() => navigate('/naming')}
                            disabled={playlist.length === 0}
                        >
                            Next: Generate Name <Play size={20} className="ml-2" />
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Recommendations;
