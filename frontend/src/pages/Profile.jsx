
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Zap, Save, Monitor, LogOut, Edit3, Check, X, Lock, Gamepad2, Trophy } from 'lucide-react';
import api from '../lib/api';
import SmartLoader from '../components/SmartLoader';
import { NinjaAI, NinjaHeadOne } from '../components/NinjaIllustrations';
import { ALL_AVATARS, getAvatarById, getRandomAvatarId } from '../components/NinjaAvatars';
import CombatStyleSelector from '../components/CombatStyleSelector';

export default function Profile() {
    const { user, isPro, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Initialize profile with a random avatar if none exists
    const [profile, setProfile] = useState({
        name: user?.user_metadata?.full_name || '',
        combat_style: 'genin',
        emailUpdates: true,
        avatarId: localStorage.getItem('ninja_avatar_id') || getRandomAvatarId()
    });

    const [promoStatus, setPromoStatus] = useState(null);
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchProfile();
    }, [user]);

    async function fetchProfile() {
        setLoading(true);
        try {
            const [authRes, profileRes] = await Promise.all([
                api.post('/api/auth/on-login'),
                api.get('/api/auth/profile')
            ]);
            setPromoStatus(authRes.data.data);

            const profileData = profileRes.data.data;
            if (profileData) {
                setProfile(p => ({
                    ...p,
                    combat_style: profileData.combat_style || 'genin',
                }));
            }

            if (user?.user_metadata?.full_name && !profile.name) {
                setProfile(p => ({ ...p, name: user.user_metadata.full_name }));
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    async function handleSave() {
        setSaving(true);
        localStorage.setItem('ninja_avatar_id', profile.avatarId);

        // SYNC HEADER AVATAR
        window.dispatchEvent(new Event('avatar-changed'));

        try {
            await api.patch('/api/auth/profile', {
                combat_style: profile.combat_style
            });
        } catch (e) {
            console.error("Failed to save profile", e);
        }

        await new Promise(r => setTimeout(r, 800));
        setSaving(false);
    }

    if (loading) return <div className="page p-10" style={{ height: '100vh' }}><SmartLoader /></div>;

    const isPromo = promoStatus?.promoApplied || isPro;
    const googleAvatar = user?.user_metadata?.avatar_url;

    // Determine which avatar to show
    const CurrentAvatarComp = getAvatarById(profile.avatarId).Component;

    return (
        <div className="page" style={{ paddingBottom: 80, background: '#050510', minHeight: '100vh' }}>
            <div className="container" style={{ maxWidth: '95vw', padding: '0 20px', width: '100%' }}>

                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 24px)', marginBottom: 48, paddingTop: 48,
                    flexWrap: 'wrap',
                    borderBottom: '1px solid var(--ninja-border)', paddingBottom: 40
                }}>
                    <div style={{ filter: 'drop-shadow(0 0 32px rgba(14,165,233,0.5))' }}>
                        <NinjaAI width={120} height={120} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(36px, 8vw, 64px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-3px', lineHeight: 1, marginBottom: 16 }}>
                            Operative <span className="text-gradient">Dossier</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 18, letterSpacing: '4px' }}>:: CLASSIFIED ACCESS ONLY ::</p>
                    </div>
                </div>

                <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 450px) 1fr', gap: 60 }}>

                    {/* Left Column: ID Card & Avatar */}
                    <div>
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                            {/* Avatar Editor Modal Overlay */}
                            {isEditingAvatar && (
                                <div style={{
                                    position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.9)',
                                    display: 'flex', flexDirection: 'column', padding: 20, overflowY: 'auto'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Select Identity</h3>
                                        <button onClick={() => setIsEditingAvatar(false)}><X size={24} /></button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                        {ALL_AVATARS.map((av, index) => (
                                            <div
                                                key={av.id}
                                                onClick={() => { setProfile({ ...profile, avatarId: av.id }); setIsEditingAvatar(false); }}
                                                className="avatar-option"
                                                style={{
                                                    cursor: 'pointer', borderRadius: 12, padding: 12,
                                                    border: profile.avatarId === av.id ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                                                    background: profile.avatarId === av.id ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255,255,255,0.03)',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    animation: `floatSimple 6s ease-in-out infinite`,
                                                    animationDelay: `${index * 0.2}s`,
                                                    boxShadow: profile.avatarId === av.id ? '0 0 15px rgba(14, 165, 233, 0.3)' : 'none'
                                                }}
                                            >
                                                <div style={{ transform: 'scale(0.9)' }}>
                                                    <av.Component />
                                                </div>
                                                <div style={{ fontSize: 10, textAlign: 'center', marginTop: 8, color: profile.avatarId === av.id ? 'white' : 'var(--text-muted)', fontWeight: 700 }}>{av.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ padding: 48, textAlign: 'center', background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.15), transparent 70%)' }}>
                                <div
                                    className="avatar-container"
                                    onClick={() => setIsEditingAvatar(true)}
                                    style={{
                                        width: 160, height: 160, borderRadius: '50%', margin: '0 auto 32px',
                                        border: '4px solid var(--ninja-surface)', padding: 6,
                                        background: 'var(--ninja-black)', cursor: 'pointer',
                                        position: 'relative',
                                        boxShadow: '0 0 30px rgba(0,0,0,0.6)',
                                        animation: 'float3D 8s ease-in-out infinite',
                                        transformStyle: 'preserve-3d'
                                    }}
                                >
                                    <CurrentAvatarComp />
                                    <div style={{
                                        position: 'absolute', bottom: 8, right: 8,
                                        background: 'var(--primary)', borderRadius: '50%', padding: 10,
                                        border: '4px solid var(--ninja-black)',
                                        zIndex: 2,
                                        animation: 'pulse 2s infinite'
                                    }}>
                                        <Edit3 size={18} color="white" />
                                    </div>
                                </div>

                                <div style={{ marginBottom: 24 }}>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                                        placeholder="ENTER CALL SIGN"
                                        style={{
                                            background: 'transparent', border: 'none', borderBottom: '2px solid var(--ninja-border)',
                                            textAlign: 'center', fontSize: 28, fontWeight: 900, color: 'white',
                                            width: '100%', padding: '12px 0', textTransform: 'uppercase',
                                            fontFamily: 'monospace', letterSpacing: '-0.5px'
                                        }}
                                    />
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, letterSpacing: '2px' }}>CLICK TO EDIT CALL SIGN</div>
                                </div>

                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '8px 16px', borderRadius: 24,
                                    background: isPro ? 'rgba(245, 158, 11, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                    color: isPro ? 'var(--amber)' : 'var(--text-muted)',
                                    border: `1px solid ${isPro ? 'var(--amber)' : 'var(--ninja-border)'}`,
                                    fontSize: 13, fontWeight: 800, letterSpacing: '1px'
                                }}>
                                    {isPro ? <><Zap size={16} /> JONIN (PRO)</> : 'GENIN (FREE)'}
                                </div>
                            </div>

                            {/* Sign Out */}
                            <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <button onClick={signOut} className="btn btn-ghost" style={{ width: '100%', color: 'var(--crimson)', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>
                                    <LogOut size={16} style={{ marginRight: 10 }} /> DEACTIVATE SESSION
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Settings */}
                    <div>
                        <div className="glass-card" style={{ padding: 40, marginBottom: 32 }}>
                            {/* Persona Selector - REPLACED WITH COMBAT STYLE SELECTOR */}
                            <div style={{ marginBottom: 40 }}>
                                <CombatStyleSelector
                                    currentStyle={profile.combat_style}
                                    onSelect={(style) => setProfile({ ...profile, combat_style: style })}
                                />
                            </div>

                            {/* Classified Roadmap */}
                            <div style={{ marginBottom: 40 }}>
                                <div style={{
                                    fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 20,
                                    textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 10
                                }}>
                                    <Lock size={16} color="#ef4444" /> Classified Roadmap
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                                    {/* Paper Trading */}
                                    <div className="glass-card" style={{
                                        padding: 24, border: '1px dashed rgba(148,163,184,0.2)', opacity: 0.7,
                                        position: 'relative', overflow: 'hidden', background: 'rgba(15,23,42,0.4)'
                                    }}>
                                        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.2) 10px, rgba(0,0,0,0.2) 20px)' }} />
                                        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                                            <div style={{
                                                background: 'rgba(255,255,255,0.05)', width: 56, height: 56, borderRadius: 16,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                                            }}>
                                                <Gamepad2 size={28} color="#94a3b8" />
                                            </div>
                                            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Paper Trading</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>Simulate live strategies without risking capital.</div>
                                            <div style={{
                                                marginTop: 20, fontSize: 11, fontWeight: 700, color: '#eab308',
                                                background: 'rgba(234, 179, 8, 0.1)', display: 'inline-block', padding: '6px 12px', borderRadius: 6, letterSpacing: '0.05em'
                                            }}>COMING SOON</div>
                                        </div>
                                    </div>

                                    {/* Leaderboard */}
                                    <div className="glass-card" style={{
                                        padding: 24, border: '1px dashed rgba(148,163,184,0.2)', opacity: 0.7,
                                        position: 'relative', overflow: 'hidden', background: 'rgba(15,23,42,0.4)'
                                    }}>
                                        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.2) 10px, rgba(0,0,0,0.2) 20px)' }} />
                                        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                                            <div style={{
                                                background: 'rgba(255,255,255,0.05)', width: 56, height: 56, borderRadius: 16,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                                            }}>
                                                <Trophy size={28} color="#94a3b8" />
                                            </div>
                                            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Global Rankings</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>Compete for top operative status & rewards.</div>
                                            <div style={{
                                                marginTop: 20, fontSize: 11, fontWeight: 700, color: '#eab308',
                                                background: 'rgba(234, 179, 8, 0.1)', display: 'inline-block', padding: '6px 12px', borderRadius: 6, letterSpacing: '0.05em'
                                            }}>COMING SOON</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notifications */}
                            <div style={{ marginBottom: 40 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Comms Uplink
                                </div>
                                <label className="glass-card interactive" style={{ display: 'flex', gap: 20, alignItems: 'center', cursor: 'pointer', padding: 20 }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 12, background: 'var(--ninja-surface)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Monitor size={24} color={profile.emailUpdates ? 'var(--primary)' : 'var(--text-muted)'} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Daily Briefing</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Get 08:00 AM market intelligence.</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={profile.emailUpdates}
                                        onChange={e => setProfile({ ...profile, emailUpdates: e.target.checked })}
                                        style={{ width: 24, height: 24, accentColor: 'var(--primary)' }}
                                    />
                                </label>
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleSave}
                                disabled={saving}
                                style={{ width: '100%', justifyContent: 'center', fontSize: 18, padding: '16px' }}
                            >
                                {saving ? 'SAVING DATA...' : 'SAVE CONFIGURATION'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .glass-card.interactive:hover {
                    border-color: var(--primary);
                    background: rgba(14, 165, 233, 0.05);
                }
                .input:focus {
                    outline: none;
                    border-bottom-color: var(--primary) !important;
                }
                .avatar-option:hover {
                    background: rgba(255,255,255,0.08) !important;
                    transform: scale(1.05) translateY(-5px);
                    border-color: rgba(255,255,255,0.3) !important;
                }
                @keyframes float3D {
                    0% { transform: perspective(1000px) translate3d(0, 0, 0) rotateX(0) rotateY(0); }
                    20% { transform: perspective(1000px) translate3d(8px, -8px, 15px) rotateX(5deg) rotateY(5deg); }
                    40% { transform: perspective(1000px) translate3d(-6px, 6px, -10px) rotateX(-5deg) rotateY(-3deg); }
                    60% { transform: perspective(1000px) translate3d(-8px, -4px, 10px) rotateX(3deg) rotateY(-5deg); }
                    80% { transform: perspective(1000px) translate3d(5px, 5px, -5px) rotateX(-2deg) rotateY(3deg); }
                    100% { transform: perspective(1000px) translate3d(0, 0, 0) rotateX(0) rotateY(0); }
                }

                @keyframes floatSimple {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7); }
                    70% { box-shadow: 0 0 0 6px rgba(14, 165, 233, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
                }
            `}</style>
            <style>{`
                @media (min-width: 1024px) {
                    .profile-grid {
                        grid-template-columns: 420px 1fr !important;
                        align-items: start;
                    }
                }
                @media (max-width: 768px) {
                    .profile-grid {
                        grid-template-columns: 1fr !important;
                        gap: 32px !important;
                    }
                    h1 { font-size: 32px !important; }
                }
            `}</style>
        </div>
    );
}
