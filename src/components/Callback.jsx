import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { parseUserTokenFromHash } from '../services/spotify';

function Callback({ setUserToken }) {
    const navigate = useNavigate();

    useEffect(() => {
        const token = parseUserTokenFromHash(window.location.hash);
        if (token) {
            setUserToken(token);
            localStorage.setItem('spotify_user_token', token);
            navigate('/profile');
        } else {
            navigate('/');
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

export default Callback;
