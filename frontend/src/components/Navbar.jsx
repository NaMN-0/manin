
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

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

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
        <>
            <nav style={{
                position: 'sticky', top: 'var(--banner-height, 0px)', left: 0, right: 0, zIndex: 1000,
                background: mobileOpen ? '#05050a' : 'rgba(10, 10, 15, 0.85)', // Solid background when menu open
                backdropFilter: 'blur(20px)',
                borderBottom: mobileOpen ? 'none' : '1px solid var(--ninja-border)', // Remove border when menu connects
                transition: 'background 0.3s'
            }}>
                <div className="container navbar-container" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'relative', zIndex: 1001,
                    width: '100%'
                }}>
                    {/* Logo Section */}
                    <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
                        <Link to={user ? "/welcome" : "/"} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            textDecoration: 'none', color: 'var(--text-primary)',
                            whiteSpace: 'nowrap'
                        }}>
                            <TraderNinjaLogo style={{ width: 32, height: 32, flexShrink: 0 }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, color: 'white' }}>
                                    KAGE<span className="text-gradient"> AI</span>
                                </span>
                                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em' }} className="hide-mobile">
                                    PRECISION TRADING
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Nav Section (Centered) */}
                    <div style={{
                        flex: '1 1 auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }} className="nav-desktop">
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
                                    whiteSpace: 'nowrap'
                                }}>
                                    {link.icon && <link.icon size={16} />}
                                    {link.label}
                                    {link.pro && <span className="badge badge-pro" style={{ fontSize: 10, padding: '2px 6px' }}>AI</span>}
                                </Link>
                            );
                        })}
                    </div>

                    {/* User Section (Right) */}
                    <div className="nav-user-section" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>

                        {/* PRO BADGE */}
                        {isPro ? (
                            <div style={{ position: 'relative' }} className="hide-mobile"
                                onMouseEnter={() => setShowProTooltip(true)}
                                onMouseLeave={() => setShowProTooltip(false)}
                            >
                                <span style={{
                                    fontSize: 11, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000',
                                    borderRadius: 20, fontWeight: 700, cursor: 'pointer',
                                    boxShadow: '0 0 12px rgba(245,158,11,0.3)',
                                    whiteSpace: 'nowrap'
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
                            <Link to="/pro" style={{ textDecoration: 'none' }} className="hide-mobile">
                                <span style={{
                                    fontSize: 11, padding: '6px 12px', border: '1px solid #f59e0b', color: '#f59e0b',
                                    borderRadius: 20, fontWeight: 600, transition: 'all 0.2s',
                                }}>
                                    BECOME PRO
                                </span>
                            </Link>
                        )}

                        {/* Profile Avatar */}
                        <Link to="/profile" style={{
                            width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                            background: 'var(--ninja-surface)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid var(--ninja-border)', textDecoration: 'none',
                            transition: 'border-color 0.2s',
                            flexShrink: 0
                        }}>
                            {googleAvatar && !imgError ? (
                                <img src={googleAvatar} alt="Profile" onError={() => setImgError(true)}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : NinjaAvatar ? (
                                <NinjaAvatar width={24} height={24} />
                            ) : (
                                <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
                                    {user.email?.[0]?.toUpperCase()}
                                </span>
                            )}
                        </Link>

                        {/* Mobile menu Button */}
                        <button className="btn btn-ghost mobile-menu-btn"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            style={{ display: 'none', padding: 8, color: mobileOpen ? 'var(--primary)' : 'var(--text-secondary)', flexShrink: 0 }}>
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Nav Overlay */}
            <div style={{
                position: 'fixed', inset: 0, top: 'calc(64px + var(--banner-height, 0px))', zIndex: 999,
                background: '#05050a', // Solid background to match header
                transform: mobileOpen ? 'translateY(0)' : 'translateY(-100%)',
                opacity: mobileOpen ? 1 : 0,
                pointerEvents: mobileOpen ? 'auto' : 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex', flexDirection: 'column',
                borderTop: '1px solid var(--ninja-border)',
            }}>
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {navLinks.map(link => {
                        if (link.auth && !user) return null;
                        if (link.hideOnAuth && user) return null;
                        const active = isActive(link.to);
                        return (
                            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                                style={{
                                    padding: '16px 20px', borderRadius: 'var(--radius-md)',
                                    fontSize: 16, fontWeight: active ? 600 : 500,
                                    color: active ? 'white' : 'var(--text-secondary)',
                                    background: active ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                                    border: active ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14,
                                    transition: 'all 0.2s',
                                    boxShadow: active ? '0 8px 24px rgba(14,165,233,0.25)' : 'none',
                                }}>
                                <link.icon size={20} style={{ opacity: active ? 1 : 0.7 }} />
                                {link.label}
                                {link.pro && <span className="badge" style={{
                                    fontSize: 10, padding: '2px 8px', borderRadius: 12,
                                    background: active ? 'rgba(0,0,0,0.2)' : 'var(--gradient-amber)',
                                    color: active ? 'white' : 'black', fontWeight: 700, marginLeft: 'auto'
                                }}>AI PRO</span>}
                            </Link>
                        );
                    })}

                    <div style={{ height: 1, background: 'var(--ninja-border)', margin: '16px 0' }} />

                    {!isPro && (
                        <Link to="/pro" onClick={() => setMobileOpen(false)}
                            style={{
                                padding: '16px 20px', borderRadius: 'var(--radius-md)',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                border: 'none', color: '#000', fontWeight: 700, fontSize: 16,
                                textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                boxShadow: '0 8px 20px rgba(245,158,11,0.2)',
                            }}>
                            <Crown size={18} fill="currentColor" /> Upgrade to Pro
                        </Link>
                    )}

                    <button onClick={() => { signOut(); setMobileOpen(false); }}
                        style={{
                            padding: '16px 20px', borderRadius: 'var(--radius-md)',
                            fontSize: 16, fontWeight: 600,
                            color: 'var(--crimson)', background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            fontFamily: 'var(--font-sans)', marginTop: 8,
                        }}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .nav-desktop { display: none !important; }
                    .mobile-menu-btn { display: flex !important; }
                    .hide-mobile { display: none !important; }
                    .navbar-container { padding: 0 16px !important; flex-direction: row !important; }
                    .nav-user-section { gap: 8px !important; }
                }
            `}</style>
        </>
    );
}

