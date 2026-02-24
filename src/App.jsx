import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Play, Plus, Check, RefreshCw, Copy, ExternalLink, Music, Sparkles, Wand2, Hash, Headphones, User, LogIn } from 'lucide-react';

import { searchTrack, getRecommendations, getPlaylistTracks, getLoginUrl, parseUserTokenFromHash, getUserProfileAndPlaylists } from './services/spotify';

import { generatePlaylistNames } from './services/gemini';

// --- COMPONENTS ---

function Navbar({ userProfile }) {
    const navigate = useNavigate();

    return (
        <nav className="navbar">
            <h2 className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', margin: 0 }}>Mood Muse</h2>
            <div className="nav-actions">
                {userProfile ? (
                    <button className="btn btn-secondary btn-sm flex-center" onClick={() => navigate('/profile')}>
                        {userProfile.image ?
                            <img src={userProfile.image} alt="Profile" className="profile-img-small" /> :
                            <User size={18} className="mr-2" />
                        }
                        {userProfile.name}
                    </button>
                ) : (
                    <button className="btn btn-primary btn-sm flex-center" onClick={() => window.location.href = getLoginUrl()}>
                        <LogIn size={18} className="mr-2" /> Login with Spotify
                    </button>
                )}
            </div>
        </nav>
    );
}

function Callback({ setUserToken }) {
    const navigate = useNavigate();

    useEffect(() => {
        const token = parseUserTokenFromHash(window.location.hash);
        if (token) {
            setUserToken(token);
            localStorage.setItem('spotify_user_token', token);
            navigate('/profile');
        } else {
            navigate('/'); // Failed login
        }
    }, [navigate, setUserToken]);

    return (
        <div className="container center-content fade-in">
            <div className="loading-state">
                <RefreshCw size={32} className="spin mb-4 text-primary" />
                <h2>Connecting to Spotify...</h2>
            </div>
        </div>
    );
}

function PlaylistSelector({ userProfile }) {
    const navigate = useNavigate();
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userProfile) { // Basic safety net
            navigate('/');
            return;
        }

        const fetchPlaylists = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/playlists', {
                    withCredentials: true
                });
                setPlaylists(response.data);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) {
                    setError("Session expired. Please log in again.");
                    localStorage.removeItem('spotify_user_token');
                } else {
                    setError("Failed to fetch your playlists. Check backend connection.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPlaylists();
    }, [userProfile, navigate]);

    const handleSelectPlaylist = (playlistId) => {
        // Navigate to the analysis engine screen
        navigate(`/analyze/${playlistId}`);
    };

    if (loading) {
        return <div className="container center-content fade-in"><div className="loading-state">Loading your library...</div></div>;
    }

    return (
        <div className="container fade-in mt-12">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="mb-2">Hey, {userProfile?.name || 'there'}!</h1>
                    <p className="text-muted">Select one of your playlists to generate a hyper-specific Gen-Z title for it.</p>
                </div>
                <button className="btn-text" onClick={() => {
                    localStorage.removeItem('spotify_user_token');
                    window.location.href = '/';
                }}>Log out</button>
            </div>

            {error && <p className="mb-4" style={{ color: 'var(--coral)', fontWeight: 'bold' }}>{error}</p>}

            <div className="playlist-grid">
                {playlists.map(p => (
                    <div key={p.id} className="card playlist-card bounce-hover" onClick={() => handleSelectPlaylist(p.id)}>
                        {p.image ? (
                            <img src={p.image} alt={p.name} className="playlist-img" />
                        ) : (
                            <div className="playlist-img-placeholder flex-center"><Music size={32} /></div>
                        )}
                        <h4 className="mt-4 truncate">{p.name}</h4>
                        <p className="text-muted text-sm">{p.totalTracks} tracks</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Home({ setSeedTrack, setPlaylist }) {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleStart = async () => {
        if (input.trim()) {
            setLoading(true);
            setError('');

            // Check if it's a playlist URL
            if (input.includes('spotify.com/playlist/') || input.includes('spotify:playlist:')) {
                const tracks = await getPlaylistTracks(input);
                setLoading(false);
                if (tracks && tracks.length > 0) {
                    setPlaylist(tracks);
                    navigate('/naming');
                } else {
                    setError('Could not fetch tracks from that playlist. Make sure it is public and your API keys are valid.');
                }
                return;
            }

            // Normal single track search
            const track = await searchTrack(input);
            setLoading(false);

            if (track) {
                setSeedTrack(track); // Store real track object {id, name, artists}
                navigate('/recommendations');
            } else {
                setError('Whoops. Could not find that song on Spotify. Try another one, or check your API keys.');
            }
        }
    };

    const marqueeTexts = [
        "Villain Arc Energy",
        "2AM Existential Spiral",
        "Soft Girl Autumn",
        "Night Drive Cinematic",
        "Main Character Energy",
        "POV: You're In A Movie"
    ];

    return (
        <div className="container center-content fade-in">
            <div className="hero-section">
                <h1 className="hero-title">Build a playlist that feels like you.</h1>
                <p className="hero-subtitle">Curate the mood. Not just generic vibes—hyper-specific Gen-Z cultural moments.</p>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Enter a song, artist, or Spotify track/playlist link..."
                        className="search-input"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleStart()}
                        disabled={loading}
                    />
                    <button className="btn btn-primary flex-center" onClick={handleStart} disabled={loading}>
                        {loading ? <RefreshCw size={20} className="mr-2 spin" /> : <Sparkles size={20} className="mr-2" />}
                        {loading ? 'Finding vibe...' : 'Start Exploring'}
                    </button>
                </div>
                {error && <p className="mt-4" style={{ color: 'var(--coral)', fontWeight: 'bold' }}>{error}</p>}

                {/* Decorative floating shapes */}
                <div className="shape shape-1" style={{ background: 'var(--mint)' }}></div>
                <div className="shape shape-2" style={{ background: 'var(--lavender)' }}></div>
                <div className="shape shape-3"></div>
            </div>

            {/* Marquee Section */}
            <div className="marquee-container">
                <div className="marquee-content">
                    {marqueeTexts.map((text, i) => (
                        <span key={i} className="flex items-center">
                            <Sparkles size={24} className="inline mr-3" style={{ color: 'var(--butter)' }} /> {text}
                        </span>
                    ))}
                    {/* Repeat for seamless loop */}
                    {marqueeTexts.map((text, i) => (
                        <span key={`repeat - ${i}`} className="flex items-center">
                            <Sparkles size={24} className="inline mr-3" style={{ color: 'var(--butter)' }} /> {text}
                        </span>
                    ))}
                </div>
            </div>

            <div className="homepage-sections">
                {/* How it Works Section */}
                <section>
                    <h2 className="section-title text-center mb-8">How it works</h2>
                    <div className="steps-grid">
                        <div className="card step-card">
                            <div className="step-number">1</div>
                            <h3>Pick a Seed</h3>
                            <p className="text-muted mt-4">Drop in a Spotify song link or search an artist to anchor your vibe.</p>
                        </div>
                        <div className="card step-card">
                            <div className="step-number">2</div>
                            <h3>Tune the Vibe</h3>
                            <p className="text-muted mt-4">Use our sliders to inject chaos, underground energy, or main character syndrome.</p>
                        </div>
                        <div className="card step-card">
                            <div className="step-number">3</div>
                            <h3>Claim Your Name</h3>
                            <p className="text-muted mt-4">Generate 100% unique, AI-crafted playlist titles that actually sound like you.</p>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section>
                    <h2 className="section-title text-center mb-8">Why MoodMuse?</h2>
                    <div className="features-grid">
                        <div className="card feature-card">
                            <div className="feature-icon-wrapper">
                                <Headphones size={24} color="var(--text-main)" />
                            </div>
                            <h3>Sonic Fingerprinting</h3>
                            <p className="text-muted">We don't just look at genre, we look at the audio features to find hidden gems with the exact same energy.</p>
                        </div>
                        <div className="card feature-card">
                            <div className="feature-icon-wrapper">
                                <Wand2 size={24} color="var(--text-main)" />
                            </div>
                            <h3>AI Curation</h3>
                            <p className="text-muted">Powered by Spotify's recommendation engine layered with our custom prompt modifiers.</p>
                        </div>
                        <div className="card feature-card">
                            <div className="feature-icon-wrapper">
                                <Hash size={24} color="var(--text-main)" />
                            </div>
                            <h3>Gen-Z Naming</h3>
                            <p className="text-muted">No more "My Playlist #45". Let our AI write the perfect hyper-specific cultural title.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function Recommendations({ seedTrack, playlist, setPlaylist }) {
    const navigate = useNavigate();

    const [chaos, setChaos] = useState(50);
    const [underground, setUnderground] = useState(30);
    const [villain, setVillain] = useState(false);
    const [feminine, setFeminine] = useState(false);
    const [era, setEra] = useState('Mixed'); // Spotify handles era filtering poorly via pure recs without complex queries, so we use it mostly for UI in this iteration

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
                        <div className="loading-state">Curating the vibe...</div>
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
                            Next: Generate Playlist Name <Play size={20} className="ml-2" />
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}

function Naming({ playlist, finalName, setFinalName }) {
    const navigate = useNavigate();

    const modes = ['Main Character Energy', 'Villain Arc', 'Situationship Core', '2AM Existential Spiral', 'Rage Gym Energy', 'Delulu Academic Era', 'Soft Girl Autumn', 'Night Drive Cinematic'];
    const [activeMode, setActiveMode] = useState(modes[0]);

    const [irony, setIrony] = useState(80);
    const [drama, setDrama] = useState(90);
    const [caps, setCaps] = useState('all lowercase');

    const [names, setNames] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingIndex, setEditingIndex] = useState(-1);

    const generate = async () => {
        setLoading(true);
        const resultNames = await generatePlaylistNames(playlist, activeMode, irony, drama, caps);
        setNames(resultNames.length > 0 ? resultNames : ["Error communicating with AI. Check your .env.local keys."]);
        setEditingIndex(-1);
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
            <div className="container center-content">
                <h2>You need some tracks first!</h2>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/recommendations')}>Go Back</button>
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
                    <div className="vibe-modes mb-6">
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

                        <button className="btn btn-primary mt-4 w-full flex-center" onClick={generate}>
                            <RefreshCw size={16} className="mr-2" /> Regenerate Names
                        </button>
                    </div>
                </div>

                <div className="naming-results">
                    <h3 className="mb-4">Your Iconic Names</h3>
                    <p className="text-muted mb-6">Click any name to edit it before confirming.</p>
                    <div className="names-list">
                        {names.map((n, i) => (
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
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

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
            // Success! We can navigate back or show a success state.
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
            <div className="container center-content">
                <h2 style={{ color: 'var(--coral)' }}>Analysis Failed</h2>
                <p>{error}</p>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/profile')}>Go Back</button>
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
                        <h4 style={{ textDecoration: 'line-through', opacity: 0.7 }}>{result.playlistInfo.name}</h4>
                    </div>

                    <div className="vibe-modes mb-6">
                        <div className="btn-vibe active" style={{ cursor: 'default' }}>
                            <Sparkles size={16} className="mr-2 inline" /> {result.vibeLabel}
                        </div>
                    </div>

                    <div className="customizers border-top pt-4">
                        <h4>Acoustic Profile</h4>
                        <div className="mt-4 text-sm text-muted">
                            <div className="flex justify-between mb-2"><span>Tempo</span> <span>{Math.round(result.aggregateVector.avgTempo)} BPM</span></div>
                            <div className="flex justify-between mb-2"><span>Energy</span> <span>{(result.aggregateVector.avgEnergy * 100).toFixed(0)}%</span></div>
                            <div className="flex justify-between mb-2"><span>Happiness</span> <span>{(result.aggregateVector.avgValence * 100).toFixed(0)}%</span></div>
                            <div className="flex justify-between"><span>Danceability</span> <span>{(result.aggregateVector.avgDanceability * 100).toFixed(0)}%</span></div>
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
                                {selectedName === n && !customName && <Check size={20} className="text-primary" />}
                            </div>
                        ))}
                    </div>

                    <div className="control-group mt-6">
                        <label>Custom Name Override:</label>
                        <input
                            type="text"
                            className="vibe-select w-full"
                            style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                            placeholder="Type your own..."
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                        />
                    </div>

                    <div className="mt-8 border-top pt-6 text-right">
                        <button
                            className="btn btn-primary btn-large"
                            onClick={handleApply}
                            disabled={applying || (!selectedName && !customName)}
                        >
                            {applying ? <RefreshCw className="spin" size={20} /> : <Wand2 size={20} className="mr-2 inline" />}
                            {applying ? 'Applying...' : 'Confirm & Apply to Spotify'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Export() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    const finalName = state?.finalName;
    const playlist = state?.playlist;

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!finalName) {
        return (
            <div className="container center-content">
                <h2>Missing Playlist Info</h2>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Start Over</button>
            </div>
        );
    }

    return (
        <div className="container center-content fade-in">
            <div className="export-card card">
                <h1 className="mb-2 text-center" style={{ textWrap: 'balance', fontSize: '3rem' }}>{finalName}</h1>
                <p className="subtitle mb-8 text-center"><Music size={16} className="inline mr-2" /> {playlist?.length || 0} Tracks</p>

                <div className="export-actions mb-6 flex-center gap-4">
                    <button
                        className="btn btn-primary btn-large flex-center"
                        onClick={() => window.open('https://open.spotify.com/', '_blank')}
                    >
                        <ExternalLink size={20} className="mr-2" /> View on Spotify
                    </button>
                    <button
                        className="btn btn-secondary btn-large flex-center"
                        onClick={handleCopy}
                    >
                        {copied ? <Check size={20} className="mr-2" /> : <Copy size={20} className="mr-2" />} {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                </div>

                <div className="text-center mt-8">
                    <button className="btn-text" onClick={() => navigate('/')}>Start Over entirely</button>
                </div>
            </div>

            {/* Decorative floating shapes */}
            <div className="shape shape-1" style={{ background: 'var(--mint)' }}></div>
            <div className="shape shape-2" style={{ background: 'var(--lavender)' }}></div>
        </div>
    );
}

function App() {
    const [seedTrack, setSeedTrack] = useState(null);
    const [playlist, setPlaylist] = useState([]);
    const [finalName, setFinalName] = useState('');

    // Auth State
    const [userToken, setUserToken] = useState(localStorage.getItem('spotify_user_token') || null);
    const [userProfile, setUserProfile] = useState(null);

    // Fetch profile automatically if we have a token on load
    useEffect(() => {
        if (userToken && !userProfile) {
            const fetchProfile = async () => {
                const data = await getUserProfileAndPlaylists(userToken);
                if (data && data.profile) {
                    setUserProfile(data.profile);
                } else {
                    // Token is invalid/expired
                    setUserToken(null);
                    localStorage.removeItem('spotify_user_token');
                }
            };
            fetchProfile();
        }
    }, [userToken, userProfile]);

    return (
        <>
            <Navbar userProfile={userProfile} />
            <Routes>
                <Route path="/" element={<Home setSeedTrack={setSeedTrack} setPlaylist={setPlaylist} />} />
                <Route path="/callback" element={<Callback setUserToken={setUserToken} />} />
                <Route path="/profile" element={<PlaylistSelector userProfile={userProfile} />} />
                <Route path="/analyze/:id" element={<Analyze />} />
                <Route path="/export" element={<Export />} />
                {/* Legacy Routes kept temporarily */}
                <Route path="/recommendations" element={<Recommendations seedTrack={seedTrack} playlist={playlist} setPlaylist={setPlaylist} />} />
                <Route path="/naming" element={<Naming playlist={playlist} finalName={finalName} setFinalName={setFinalName} />} />
            </Routes>
        </>
    );
}

export default App;
