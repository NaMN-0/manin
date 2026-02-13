
import { Link } from 'react-router-dom';
import { Zap, X, Crown, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LifetimeBanner() {
    const { isPro, user } = useAuth();
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const height = (visible && !isPro && user) ? document.getElementById('lifetime-banner')?.offsetHeight || 0 : 0;
        document.documentElement.style.setProperty('--banner-height', `${height}px`);
        return () => document.documentElement.style.setProperty('--banner-height', '0px');
    }, [visible, isPro, user]);

    if (!user || isPro || !visible) return null;

    return (
        <div id="lifetime-banner" style={{
            background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
            borderBottom: '1px solid var(--primary)',
            padding: '8px 16px',
            position: 'relative',
            zIndex: 99
        }}>
            <div className="container" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
                fontSize: 13, color: 'white', flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        background: 'var(--amber)', color: 'black', borderRadius: 4,
                        padding: '2px 6px', fontSize: 10, fontWeight: 900
                    }}>
                        LIFETIME
                    </div>
                    <span style={{ fontWeight: 600 }}>
                        Get <span style={{ color: 'var(--primary)' }}>Early Bird Access</span> for just ₹999.
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                        <Clock size={12} /> Limited spots left.
                    </span>
                    <Link to="/pro" className="btn btn-primary btn-sm" style={{
                        height: 28, fontSize: 12, padding: '0 12px', background: 'var(--primary)'
                    }}>
                        Upgrade <Zap size={10} fill="currentColor" />
                    </Link>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setVisible(false)}
                    style={{
                        position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                    }}
                >
                    <X size={14} />
                </button>
            </div>

            <style>{`
                @media (max-width: 600px) {
                    .container { flex-direction: column; gap: 8px; text-align: center; }
                }
            `}</style>
        </div>
    );
}
