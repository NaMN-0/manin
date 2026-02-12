
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Zap, Menu, X, Rocket, BarChart2, Shield, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';
import TraderNinjaLogo from './TraderNinjaLogo';
import { getAvatarById, getRandomAvatarId } from './NinjaAvatars';

export default function Navbar() {
    const { user, isPro, signOut } = useAuth();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showProTooltip, setShowProTooltip] = useState(false);

    // Avatar Logic
    const [imgError, setImgError] = useState(false);
    const [avatarId, setAvatarId] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('ninja_avatar_id');
        if (stored) setAvatarId(stored);
        else {
            const newId = getRandomAvatarId();
            localStorage.setItem('ninja_avatar_id', newId);
            setAvatarId(newId);
        }
    }, []);

    // Listen for avatar changes (live update)
    useEffect(() => {
        const handler = () => {
            const stored = localStorage.getItem('ninja_avatar_id');
            if (stored !== avatarId) setAvatarId(stored);
        };
        window.addEventListener('storage', handler);
        window.addEventListener('avatar-changed', handler);
        return () => {
            window.removeEventListener('storage', handler);
            window.removeEventListener('avatar-changed', handler);
        };
    }, [avatarId]);

    if (!user) return null;

    const NinjaAvatar = avatarId ? getAvatarById(avatarId)?.Component : null;
    const googleAvatar = user?.user_metadata?.avatar_url;

    const navLinks = [
        { to: '/', label: 'Home', icon: Shield, hideOnAuth: true },
        { to: '/market', label: 'Markets', icon: BarChart2 },
        { to: '/penny', label: 'Penny Stocks', icon: Rocket, auth: true },
        { to: '/pro', label: 'Intelligence', icon: Zap, pro: true },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
            background: 'rgba(10, 10, 15, 0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--ninja-border)',
        }}>
            <div className="container" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
            }}>
                {/* Logo */}
                <Link to={user ? "/welcome" : "/"} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    textDecoration: 'none', color: 'var(--text-primary)',
                }}>
                    <TraderNinjaLogo />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, color: 'white' }}>
                            KAGE<span className="text-gradient"> AI</span>
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em' }}>PRECISION TRADING</span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="nav-desktop">
                    {navLinks.map(link => {
                        if (link.auth && !user) return null;
                        if (link.hideOnAuth && user) return null;
                        return (
                            <Link key={link.to} to={link.to} style={{
                                padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500,
                                color: isActive(link.to) ? 'var(--text-primary)' : 'var(--text-secondary)',
                                background: isActive(link.to) ? 'var(--ninja-surface)' : 'transparent',
                                textDecoration: 'none', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                {link.icon && <link.icon size={16} />}
                                {link.label}
                                {link.pro && <span className="badge badge-pro" style={{ fontSize: 10, padding: '2px 6px' }}>AI</span>}
                            </Link>
                        );
                    })}
                </div>

                {/* User section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

                    {/* PRO BADGE — Fixed with inline tooltip */}
                    {isPro ? (
                        <div style={{ position: 'relative' }}
                            onMouseEnter={() => setShowProTooltip(true)}
                            onMouseLeave={() => setShowProTooltip(false)}
                        >
                            <span style={{
                                fontSize: 11, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000',
                                borderRadius: 20, fontWeight: 700, cursor: 'pointer',
                                boxShadow: '0 0 12px rgba(245,158,11,0.3)',
                            }}>
                                <Crown size={12} fill="currentColor" /> PRO
                            </span>
                            {showProTooltip && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                                    width: 240, padding: 16,
                                    background: '#0f172a', border: '1px solid rgba(245,158,11,0.3)',
                                    borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                                    zIndex: 9999, animation: 'fadeIn 0.2s ease-out',
                                }}>
                                    <div style={{ position: 'absolute', top: -6, right: 20, width: 12, height: 12, background: '#0f172a', border: '1px solid rgba(245,158,11,0.3)', borderRight: 'none', borderBottom: 'none', transform: 'rotate(45deg)' }} />
                                    <h4 style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Crown size={14} /> Elite Status
                                    </h4>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12, color: '#94a3b8' }}>
                                        <li style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><Zap size={10} color="#f59e0b" /> Real-time AI Scans</li>
                                        <li style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><Zap size={10} color="#f59e0b" /> Unlimited Data</li>
                                        <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={10} color="#f59e0b" /> Priority Support</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/pro" style={{ textDecoration: 'none' }}>
                            <span style={{
                                fontSize: 11, padding: '6px 12px', border: '1px solid #f59e0b', color: '#f59e0b',
                                borderRadius: 20, fontWeight: 600, transition: 'all 0.2s',
                            }}>
                                BECOME PRO
                            </span>
                        </Link>
                    )}

                    {/* Profile Avatar — NinjaAvatar as primary image, no roaming */}
                    <Link to="/profile" style={{
                        width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
                        background: 'var(--ninja-surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--ninja-border)', textDecoration: 'none',
                        transition: 'border-color 0.2s',
                    }}>
                        {googleAvatar && !imgError ? (
                            <img src={googleAvatar} alt="Profile" onError={() => setImgError(true)}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : NinjaAvatar ? (
                            <NinjaAvatar width={28} height={28} />
                        ) : (
                            <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>
                                {user.email?.[0]?.toUpperCase()}
                            </span>
                        )}
                    </Link>

                    {/* Mobile menu */}
                    <button className="btn btn-ghost mobile-menu-btn"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        style={{ display: 'none', padding: 6 }}>
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav Dropdown */}
            {mobileOpen && (
                <div style={{
                    padding: '8px 16px 16px', background: 'rgba(10, 10, 15, 0.98)',
                    borderBottom: '1px solid var(--ninja-border)',
                    display: 'flex', flexDirection: 'column', gap: 2,
                    animation: 'slideDown 0.25s ease-out',
                }}>
                    {navLinks.map(link => {
                        if (link.auth && !user) return null;
                        if (link.hideOnAuth && user) return null;
                        const active = isActive(link.to);
                        return (
                            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                                style={{
                                    padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                                    fontSize: 15, fontWeight: active ? 600 : 400,
                                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    background: active ? 'var(--ninja-surface)' : 'transparent',
                                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
                                    transition: 'all 0.2s',
                                }}>
                                {link.icon && <link.icon size={18} style={{ opacity: active ? 1 : 0.5 }} />}
                                {link.label}
                                {link.pro && <span className="badge badge-pro" style={{ fontSize: 10, padding: '2px 6px' }}>AI</span>}
                            </Link>
                        );
                    })}
                    <div style={{ height: 1, background: 'var(--ninja-border)', margin: '8px 0' }} />
                    <button onClick={() => { signOut(); setMobileOpen(false); }}
                        style={{
                            padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                            fontSize: 15, color: 'var(--crimson)', background: 'transparent',
                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                            fontFamily: 'var(--font-sans)', textAlign: 'left',
                        }}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            )}

            <style>{`
                @media (max-width: 768px) {
                    .nav-desktop { display: none !important; }
                    .mobile-menu-btn { display: flex !important; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </nav>
    );
}

