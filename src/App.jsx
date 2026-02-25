import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Callback from './components/Callback';
import PlaylistSelector from './components/PlaylistSelector';
import Home from './components/Home';
import Recommendations from './components/Recommendations';
import Naming from './components/Naming';
import Analyze from './components/Analyze';
import Export from './components/Export';
import { ToastContainer } from './components/Toast';

import { getUserProfileAndPlaylists } from './services/spotify';

function App() {
    const [seedTrack, setSeedTrack] = useState(null);
    const [playlist, setPlaylist] = useState([]);
    const [finalName, setFinalName] = useState('');

    // Auth State
    const [userToken, setUserToken] = useState(localStorage.getItem('spotify_user_token') || null);
    const [userProfile, setUserProfile] = useState(null);

    // Toast State
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Fetch profile automatically if we have a token on load
    useEffect(() => {
        if (userToken && !userProfile) {
            const fetchProfile = async () => {
                const data = await getUserProfileAndPlaylists(userToken);
                if (data && data.profile) {
                    setUserProfile(data.profile);
                } else {
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
                <Route path="/" element={<Home setSeedTrack={setSeedTrack} setPlaylist={setPlaylist} addToast={addToast} />} />
                <Route path="/callback" element={<Callback setUserToken={setUserToken} />} />
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
