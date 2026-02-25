import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogIn } from 'lucide-react';
import { getLoginUrl } from '../services/spotify';

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

export default Navbar;
