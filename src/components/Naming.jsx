import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Check } from 'lucide-react';
import { generatePlaylistNames } from '../services/gemini';

function Naming({ playlist, finalName, setFinalName }) {
    const navigate = useNavigate();

    const modes = ['Main Character Energy', 'Villain Arc', 'Situationship Core', '2AM Existential Spiral', 'Rage Gym Energy', 'Delulu Academic Era', 'Soft Girl Autumn', 'Night Drive Cinematic'];
    const [activeMode, setActiveMode] = useState(modes[0]);

    const [irony, setIrony] = useState(80);
    const [drama, setDrama] = useState(90);
    const [caps, setCaps] = useState('all lowercase');

    const [names, setNames] = useState([]);
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        setLoading(true);
        const resultNames = await generatePlaylistNames(playlist, activeMode, irony, drama, caps);
        setNames(resultNames.length > 0 ? resultNames : ["Error communicating with AI. Check your .env.local keys."]);
        setLoading(false);
    };

    useEffect(() => {
        if (playlist.length > 0) {
            generate();
        }
    }, [activeMode, irony, drama, caps]);

    const handleChoose = (nameStr) => {
        setFinalName(nameStr);
        navigate('/export');
    };

    const updateName = (index, val) => {
        const newNames = [...names];
        newNames[index] = val;
        setNames(newNames);
    };

    if (!playlist.length) {
        return (
            <div className="container center-content fade-in">
                <div className="loading-state">
                    <h2>You need some tracks first!</h2>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/recommendations')}>Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container fade-in">
            <header className="app-header mt-12">
                <h2 className="logo" onClick={() => navigate('/')}>Mood Muse</h2>
            </header>

            <div className="naming-layout">
                <div className="naming-controls card">
                    <h3>Select Vibe Mode</h3>
                    <div className="vibe-modes mb-6 mt-4">
                        {modes.map(mode => (
                            <button
                                key={mode}
                                className={`btn-vibe ${activeMode === mode ? 'active' : ''}`}
                                onClick={() => setActiveMode(mode)}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    <div className="customizers border-top pt-4">
                        <h4>Tweaks</h4>
                        <div className="control-group mt-4">
                            <label>Irony Level</label>
                            <input type="range" min="0" max="100" value={irony} onChange={e => setIrony(Number(e.target.value))} className="vibe-slider" />
                        </div>
                        <div className="control-group">
                            <label>Drama Level</label>
                            <input type="range" min="0" max="100" value={drama} onChange={e => setDrama(Number(e.target.value))} className="vibe-slider" />
                        </div>
                        <div className="control-group">
                            <label>Capitalization</label>
                            <select className="vibe-select" value={caps} onChange={e => setCaps(e.target.value)}>
                                <option>all lowercase</option>
                                <option>Sentence case</option>
                                <option>cHAoTiC cAps</option>
                            </select>
                        </div>

                        <button className="btn btn-primary mt-4 w-full flex-center" onClick={generate} disabled={loading}>
                            <RefreshCw size={16} className={`mr-2 ${loading ? 'spin' : ''}`} /> {loading ? 'Generating...' : 'Regenerate Names'}
                        </button>
                    </div>
                </div>

                <div className="naming-results">
                    <h3 className="mb-4">Your Iconic Names</h3>
                    <p className="text-muted mb-6">Click any name to edit it before confirming.</p>
                    <div className="names-list">
                        {loading ? (
                            <div className="loading-state">
                                <RefreshCw size={24} className="spin" />
                                <p>AI is crafting your names...</p>
                            </div>
                        ) : (
                            names.map((n, i) => (
                                <div key={i} className="name-card editable-card bounce-hover">
                                    <input
                                        type="text"
                                        value={n}
                                        onChange={(e) => updateName(i, e.target.value)}
                                        className="name-input"
                                    />
                                    <button className="btn btn-secondary flex-center" onClick={() => handleChoose(n)}>
                                        Choose <Check size={16} className="ml-2" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Naming;
