import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExternalLink, Copy, Check, Music, Sparkles } from 'lucide-react';

function Confetti() {
    const pieces = useMemo(() => {
        const colors = ['#a78bfa', '#f472b6', '#38bdf8', '#34d399', '#fbbf24', '#818cf8'];
        return Array.from({ length: 50 }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 2}s`,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 6,
            rotation: Math.random() * 360,
        }));
    }, []);

    return (
        <div className="confetti-wrapper">
            {pieces.map(p => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: p.left,
                        animationDelay: p.delay,
                        backgroundColor: p.color,
                        width: p.size,
                        height: p.size,
                        transform: `rotate(${p.rotation}deg)`,
                    }}
                />
            ))}
        </div>
    );
}

function Export() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [showConfetti, setShowConfetti] = useState(true);

    const finalName = state?.finalName;
    const playlist = state?.playlist;

    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 4000);
        return () => clearTimeout(timer);
    }, []);

    const handleCopy = () => {
        if (finalName) {
            navigator.clipboard.writeText(finalName);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!finalName) {
        return (
            <div className="container center-content fade-in">
                <div className="loading-state">
                    <h2>Missing Playlist Info</h2>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Start Over</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container center-content fade-in">
            {showConfetti && <Confetti />}

            <div className="export-card card">
                <div className="mb-4">
                    <Sparkles size={40} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h1 className="mb-2">{finalName}</h1>
                <p className="subtitle mb-8"><Music size={16} className="inline mr-2" /> {playlist?.length || 0} Tracks</p>

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
                        {copied ? <Check size={20} className="mr-2" /> : <Copy size={20} className="mr-2" />} {copied ? 'Copied!' : 'Copy Name'}
                    </button>
                </div>

                <div className="text-center mt-8">
                    <button className="btn-text" onClick={() => navigate('/')}>Start Over</button>
                </div>
            </div>

            {/* Decorative floating shapes */}
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
        </div>
    );
}

export default Export;
