
import React from 'react';
import { NinjaChaos, NinjaBear, NinjaHacker } from './NinjaIllustrations';
import { useNavigate } from 'react-router-dom';
import { Home, RefreshCw } from 'lucide-react';

export default function ErrorDisplay({
    title = "System Malfunction",
    message = "The algorithms encountered an anomaly.",
    onRetry,
    type = "error" // error, warning, 404
}) {
    const navigate = useNavigate();

    let Illustration = NinjaChaos;
    let color = "var(--danger)";

    if (type === 'warning') {
        Illustration = NinjaBear;
        color = "var(--warning)";
    } else if (type === '404') {
        Illustration = NinjaHacker; // Glitch style for 404
        title = "Signal Lost (404)";
        message = "This sector of the market does not exist.";
        color = "var(--primary)";
    }

    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 24,
            background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0) 0%, #050510 100%)'
        }}>
            <div style={{
                marginBottom: 32,
                position: 'relative',
                animation: 'float 6s ease-in-out infinite'
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: color, opacity: 0.1,
                    filter: 'blur(40px)', borderRadius: '50%'
                }} />
                <Illustration width={200} height={200} />
            </div>

            <h2 style={{
                fontSize: 32, fontWeight: 800, marginBottom: 16,
                color: 'white', letterSpacing: '-0.02em'
            }}>
                {title}
            </h2>

            <p style={{
                color: 'var(--text-secondary)', maxWidth: 400, marginBottom: 32,
                lineHeight: 1.6, fontSize: 16
            }}>
                {message}
            </p>

            <div style={{ display: 'flex', gap: 16 }}>
                <button
                    onClick={() => navigate('/')}
                    className="btn"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <Home size={18} style={{ marginRight: 8 }} /> Return to Base
                </button>

                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="btn btn-primary"
                    >
                        <RefreshCw size={18} style={{ marginRight: 8 }} /> Retry Protocol
                    </button>
                )}
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
}
