import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

function Toast({ message, type = 'success', onClose }) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(onClose, 300);
        }, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type} ${exiting ? 'toast-exit' : ''}`}>
            {type === 'success' ? (
                <CheckCircle size={18} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
            ) : (
                <AlertCircle size={18} style={{ color: 'var(--accent-danger)', flexShrink: 0 }} />
            )}
            <span style={{ flex: 1 }}>{message}</span>
            <button
                onClick={() => { setExiting(true); setTimeout(onClose, 300); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
            >
                <X size={16} />
            </button>
        </div>
    );
}

export function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

export default Toast;
