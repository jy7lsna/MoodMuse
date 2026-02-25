import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw, Headphones, Wand2, Hash, Zap, Globe, Star } from 'lucide-react';
import { searchTrack, getPlaylistTracks } from '../services/spotify';

function Home({ setSeedTrack, setPlaylist, addToast }) {
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
                    addToast(`Imported ${tracks.length} tracks from playlist!`, 'success');
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
                setSeedTrack(track);
                addToast(`Found "${track.name}" — let's explore!`, 'success');
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
        "POV: You're In A Movie",
        "Chronically Online Core",
        "Delulu Academic Era"
    ];

    return (
        <div className="container center-content fade-in">
            <div className="hero-section">
                <h1 className="hero-title">Build a playlist that feels like you.</h1>
                <p className="hero-subtitle">Curate the mood. Not just generic vibes—hyper-specific Gen-Z cultural moments, powered by AI.</p>
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
                {error && <p className="mt-4" style={{ color: 'var(--accent-danger)', fontWeight: 'bold' }}>{error}</p>}

                {/* Decorative floating shapes */}
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            {/* Marquee Section */}
            <div className="marquee-container">
                <div className="marquee-content">
                    {marqueeTexts.map((text, i) => (
                        <span key={i}>
                            <Sparkles size={20} /> {text}
                        </span>
                    ))}
                    {marqueeTexts.map((text, i) => (
                        <span key={`repeat-${i}`}>
                            <Sparkles size={20} /> {text}
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
                                <Headphones size={22} />
                            </div>
                            <h3>Sonic Fingerprinting</h3>
                            <p className="text-muted">We don't just look at genre, we analyze audio features to find hidden gems with the exact same energy.</p>
                        </div>
                        <div className="card feature-card">
                            <div className="feature-icon-wrapper">
                                <Wand2 size={22} />
                            </div>
                            <h3>AI Curation</h3>
                            <p className="text-muted">Powered by Spotify's recommendation engine layered with Google Gemini's cultural intelligence.</p>
                        </div>
                        <div className="card feature-card">
                            <div className="feature-icon-wrapper">
                                <Hash size={22} />
                            </div>
                            <h3>Gen-Z Naming</h3>
                            <p className="text-muted">No more "My Playlist #45". Let our AI write the perfect hyper-specific cultural title.</p>
                        </div>
                        <div className="card feature-card">
                            <div className="feature-icon-wrapper">
                                <Zap size={22} />
                            </div>
                            <h3>Spotify Integration</h3>
                            <p className="text-muted">Log in, pick a playlist, and apply your new name directly back to Spotify with one click.</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <footer className="footer">
                <p>Built with <span style={{ color: 'var(--accent-secondary)' }}>♥</span> using React, Express, Prisma & Google Gemini</p>
                <p className="mt-2"><a href="https://github.com/jy7lsna/MoodMuse" target="_blank" rel="noopener noreferrer">View on GitHub</a></p>
            </footer>
        </div>
    );
}

export default Home;
