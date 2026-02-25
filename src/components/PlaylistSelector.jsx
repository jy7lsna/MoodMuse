import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Music } from 'lucide-react';

function PlaylistSelector({ userProfile }) {
    const navigate = useNavigate();
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userProfile) {
            navigate('/');
            return;
        }

        const fetchPlaylists = async () => {
            try {
                const response = await axios.get('/api/playlists', {
                    withCredentials: true
                });
                setPlaylists(response.data);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) {
                    setError("Session expired. Please log in again.");
                    // Session expired
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
        navigate(`/analyze/${playlistId}`);
    };

    if (loading) {
        return (
            <div className="container center-content fade-in">
                <div className="loading-state">
                    <div className="spin"><Music size={32} /></div>
                    <h2>Loading your library...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="container fade-in mt-12">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="mb-2">Hey, {userProfile?.name || 'there'}!</h1>
                    <p className="text-muted">Select one of your playlists to generate a hyper-specific Gen-Z title for it.</p>
                </div>
                <button className="btn-text" onClick={async () => {
                    await axios.post('/api/auth/logout', {}, { withCredentials: true });
                    window.location.href = '/';
                }}>Log out</button>
            </div>

            {error && <p className="mb-4" style={{ color: 'var(--accent-danger)', fontWeight: 'bold' }}>{error}</p>}

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

export default PlaylistSelector;
