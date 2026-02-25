import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import API_BASE from './config/api';

import Navbar from './components/Navbar';
import PlaylistSelector from './components/PlaylistSelector';
import Home from './components/Home';
import Recommendations from './components/Recommendations';
import Naming from './components/Naming';
import Analyze from './components/Analyze';
import Export from './components/Export';
import { ToastContainer } from './components/Toast';

function App() {
    const [seedTrack, setSeedTrack] = useState(null);
    const [playlist, setPlaylist] = useState([]);
    const [finalName, setFinalName] = useState('');

    // Auth State — now driven by backend session cookie
    const [userProfile, setUserProfile] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Toast State
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Check if user is logged in via backend session cookie
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/auth/me`, { withCredentials: true });
                if (res.data && res.data.id) {
                    setUserProfile({
                        name: res.data.display_name,
                        image: res.data.images?.[0]?.url || null,
                        id: res.data.id
                    });
                }
            } catch (err) {
                // Not logged in — that's fine
                setUserProfile(null);
            } finally {
                setAuthLoading(false);
            }
        };
        checkAuth();
    }, []);

    return (
        <>
            <Navbar userProfile={userProfile} />
            <Routes>
                <Route path="/" element={<Home setSeedTrack={setSeedTrack} setPlaylist={setPlaylist} addToast={addToast} />} />
                <Route path="/profile" element={<PlaylistSelector userProfile={userProfile} />} />
                <Route path="/analyze/:id" element={<Analyze />} />
                <Route path="/export" element={<Export />} />
                <Route path="/recommendations" element={<Recommendations seedTrack={seedTrack} playlist={playlist} setPlaylist={setPlaylist} />} />
                <Route path="/naming" element={<Naming playlist={playlist} finalName={finalName} setFinalName={setFinalName} />} />
            </Routes>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
}

export default App;
