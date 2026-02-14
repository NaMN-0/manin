import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import {
    NinjaSceneVoid, NinjaSceneSwarm, NinjaSceneAlgo, NinjaSceneStrike, NinjaSceneVictory,
    NinjaHeroIdle, NinjaHeroScanning, NinjaHeroDash, NinjaHeroShield, NinjaHeroVictory, NinjaHeroGlitch,
    NinjaDojo, NinjaDiamond, NinjaMaster, NinjaInitiate
} from '../components/NinjaIllustrations';
import { Zap, ArrowRight, MousePointer2, Shield, Target, TrendingUp } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';

// 🌧️ MATRIX RAIN
const DigitalRain = ({ intensity = 1 }) => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);
        const columns = Math.floor(window.innerWidth / 20);
        const drops = Array(columns).fill(1);
        const chars = '0101BUYSELL█▓▒░';
        const draw = () => {
            if (!ctx || !canvas) return;
            ctx.fillStyle = `rgba(5, 5, 16, ${0.1 * intensity})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0ea5e9';
            ctx.font = '14px monospace';
            for (let i = 0; i < drops.length; i++) {
                ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 20, drops[i] * 20);
                if (drops[i] * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        };
        const interval = setInterval(draw, 50);
        return () => { clearInterval(interval); window.removeEventListener('resize', resize); };
    }, [intensity]);
    return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, opacity: 0.2 * intensity }} />;
};

// 📜 SECTION
const ScrollSection = ({ children, style, className = "" }) => (
    <div className={`scroll-section ${className}`} style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '80px 24px',
        boxSizing: 'border-box',
        scrollSnapAlign: 'start',
        ...style,
    }}>
        {children}
    </div>
);

// 🥷 MANIN COMPANION (FIXED typewriter — captures index by value)
const ManinCompanion = ({ state, message }) => {
    const [visibleMessage, setVisibleMessage] = useState('');
    useEffect(() => {
        if (!message) { setVisibleMessage(''); return; }
        let idx = 0;
        setVisibleMessage('');
        const timer = setInterval(() => {
            if (idx < message.length) {
                const charIdx = idx; // capture by value
                setVisibleMessage(prev => prev + message.charAt(charIdx));
                idx++;
            } else {
                clearInterval(timer);
            }
        }, 30);
        return () => clearInterval(timer);
    }, [message]);

    let Component = NinjaHeroIdle;
    if (state === 'scanning') Component = NinjaHeroScanning;
    if (state === 'dash') Component = NinjaHeroDash;
    if (state === 'shield') Component = NinjaHeroShield;
    if (state === 'victory') Component = NinjaHeroVictory;
    if (state === 'glitch') Component = NinjaHeroGlitch;

    return (
        <div className="manin-companion" style={{
            position: 'fixed', bottom: 40, right: 40, zIndex: 60, pointerEvents: 'none',
            transition: 'all 0.5s', transform: state === 'dash' ? 'translateX(-50vw)' : 'none',
        }}>
            {visibleMessage && (
                <div style={{
                    position: 'absolute', bottom: '100%', right: 0, marginBottom: 16,
                    background: 'rgba(15,23,42,0.9)', border: '1px solid #0ea5e9',
                    borderRadius: 16, padding: 24, width: 260, backdropFilter: 'blur(12px)',
                    boxShadow: '0 0 30px rgba(14,165,233,0.3)', pointerEvents: 'auto',
                    animation: 'fadeInUp 0.4s ease-out',
                }}>
                    <p style={{ fontFamily: 'var(--font-mono)', color: '#0ea5e9', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>KAGE AI</p>
                    <p style={{ color: 'white', fontSize: 16, lineHeight: 1.4, fontWeight: 500 }}>
                        {visibleMessage}<span style={{ animation: 'blink 1s infinite' }}>_</span>
                    </p>
                    <div style={{
                        position: 'absolute', bottom: -8, right: 32, width: 16, height: 16,
                        background: 'rgba(15,23,42,0.9)', borderRight: '1px solid #0ea5e9',
                        borderBottom: '1px solid #0ea5e9', transform: 'rotate(45deg)',
                    }} />
                </div>
            )}
            <div style={{ width: 120, height: 120, filter: 'drop-shadow(0 0 20px rgba(14,165,233,0.4))' }}>
                <Component width="100%" height="100%" />
            </div>
        </div>
    );
};


import { usePostHog } from 'posthog-js/react';

export default function Landing() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const [currentScene, setCurrentScene] = useState(0);
    const posthog = usePostHog();

    useEffect(() => {
        posthog?.capture('viewed_landing');

        const handleScroll = () => {
            if (!containerRef.current) return;
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            const progress = scrollTop / (scrollHeight - clientHeight);
            setCurrentScene(Math.min(5, Math.floor(progress * 6)));
        };
        const el = containerRef.current;
        if (el) el.addEventListener('scroll', handleScroll);
        return () => { if (el) el.removeEventListener('scroll', handleScroll); };
    }, [posthog]);

    const handleGetStarted = () => {
        posthog?.capture('clicked_get_started', { user_status: user ? 'logged_in' : 'guest' });
        navigate(user ? '/market' : '/login');
    };

    // Clearer, more relatable story
    const scenes = useMemo(() => [
        { bg: '#050510', manin: 'idle', text: "Every day, thousands of stocks move. Most people miss the ones that matter." },
        { bg: '#1a0505', manin: 'shield', text: "Social media hype, FOMO, conflicting signals — it's designed to confuse you." },
        { bg: '#0f172a', manin: 'scanning', text: "What if an AI scanned every stock for you and found the real opportunities?" },
        { bg: '#051a1a', manin: 'dash', text: "No guessing. No gut feelings. Just data-driven decisions, in seconds." },
        { bg: '#050510', manin: 'victory', text: "Whether you're just starting or managing serious capital — KAGE AI adapts to you." },
        { bg: '#0f172a', manin: 'victory', text: "Your edge in the market starts here. Ready?" },
    ], []);

    const activeConfig = scenes[currentScene] || scenes[0];

    return (
        <div className="landing-container" style={{
            position: 'relative', width: '100%', overflow: 'hidden',
            background: '#050510', color: 'white', fontFamily: 'var(--font-sans)',
            height: 'calc(100vh - 64px)',
        }}>
            {/* Fixed BG */}
            <div className="landing-bg" style={{
                position: 'absolute', inset: 0, transition: 'background-color 1s ease', zIndex: 0,
                backgroundColor: activeConfig.bg,
            }}>
                <DigitalRain intensity={currentScene === 0 ? 0.5 : currentScene === 1 ? 1.5 : 0.3} />
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.8,
                    background: 'linear-gradient(to top, #050510, transparent, transparent)',
                }} />
            </div>

            <ManinCompanion state={activeConfig.manin} message={activeConfig.text} />

            {/* Scroll Container */}
            <div ref={containerRef} className="scroll-container" style={{
                height: '100%', width: '100%', overflowY: 'auto',
                scrollSnapType: 'y mandatory', position: 'relative', zIndex: 10, scrollBehavior: 'smooth',
            }}>

                {/* ═══ SCENE 1: HOOK ═══ */}
                <ScrollSection>
                    <div style={{ textAlign: 'center', position: 'relative', maxWidth: 800, padding: '0 24px' }}>
                        <div style={{
                            width: 320, maxWidth: '70vw', height: 320, maxHeight: '40vh',
                            margin: '0 auto 40px', animation: 'float 6s ease-in-out infinite',
                        }}>
                            <NinjaSceneVoid width="100%" height="100%" />
                        </div>
                        <h1 style={{
                            fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 900, letterSpacing: '-0.04em',
                            marginBottom: 24, lineHeight: 1.05,
                            background: 'linear-gradient(to bottom right, #fff, #64748b)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Welcome to<br /><span style={{ WebkitTextFillColor: '#0ea5e9' }}>KAGE AI</span>
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: 'clamp(16px, 2vw, 20px)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
                            AI-powered stock intelligence that finds real opportunities — so you don't have to stare at charts all day.
                        </p>
                        <div style={{
                            position: 'absolute', bottom: -60, left: '50%', transform: 'translateX(-50%)',
                            opacity: 0.4, animation: 'bounce 2s infinite',
                        }}>
                            <MousePointer2 size={28} />
                        </div>
                    </div>
                </ScrollSection>

                {/* ═══ SCENE 2: THE PROBLEM ═══ */}
                <ScrollSection>
                    <div className="scene-grid" style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 48, maxWidth: 1100, width: '100%', alignItems: 'center',
                    }}>
                        <div>
                            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, marginBottom: 20, color: '#ef4444', lineHeight: 1.1 }}>
                                Information Overload<br />Kills Profits.
                            </h2>
                            <p style={{ fontSize: 'clamp(15px, 1.8vw, 20px)', color: '#cbd5e1', lineHeight: 1.7 }}>
                                Twitter tips, YouTube gurus, Reddit hype — everyone has an opinion.<br />
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>95% of retail traders lose money</span> chasing noise.<br />
                                The market rewards those who think clearly.
                            </p>
                        </div>
                        <div style={{ maxWidth: 420, margin: '0 auto', animation: 'shake 0.5s linear infinite' }}>
                            <NinjaSceneSwarm width="100%" height="100%" />
                        </div>
                    </div>
                </ScrollSection>

                {/* ═══ SCENE 3: THE SOLUTION ═══ */}
                <ScrollSection>
                    <div className="scene-grid" style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 48, maxWidth: 1100, width: '100%', alignItems: 'center',
                    }}>
                        <div style={{ maxWidth: 420, margin: '0 auto' }}>
                            <NinjaSceneAlgo width="100%" height="100%" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, marginBottom: 20, color: '#10b981', lineHeight: 1.1 }}>
                                What If AI Did<br />The Heavy Lifting?
                            </h2>
                            <p style={{ fontSize: 'clamp(15px, 1.8vw, 20px)', color: '#cbd5e1', lineHeight: 1.7 }}>
                                KAGE AI scans <span style={{ color: '#10b981', fontWeight: 600 }}>thousands of stocks</span> in seconds.<br />
                                It finds the patterns humans miss — momentum shifts, volume surges, breakout setups.<br />
                                You get a clear scorecard. No noise, just signal.
                            </p>
                        </div>
                    </div>
                </ScrollSection>

                {/* ═══ SCENE 4: THREE PATHS ═══ */}
                <ScrollSection>
                    <div style={{ maxWidth: 1280, width: '100%' }}>
                        <h2 style={{
                            fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, textAlign: 'center', marginBottom: 48, lineHeight: 1.1,
                        }}>
                            One Platform. <span style={{ color: '#0ea5e9' }}>Every Level.</span>
                        </h2>

                        <div className="paths-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(12, 1fr)',
                            gap: 24,
                            alignItems: 'stretch',
                            width: '100%'
                        }}>

                            {/* PATH 1: Just Starting Out */}
                            <div className="path-card" style={{
                                gridColumn: 'span 4',
                                background: 'linear-gradient(180deg, rgba(14,165,233,0.06) 0%, rgba(15,23,42,0.6) 100%)',
                                border: '1px solid rgba(14,165,233,0.15)', borderRadius: 20, padding: '32px 24px',
                                display: 'flex', flexDirection: 'column',
                            }}>
                                <div style={{ width: 80, height: 80, marginBottom: 20, opacity: 0.8 }}>
                                    <NinjaInitiate width={80} height={80} />
                                </div>
                                <div style={{
                                    fontSize: 11, fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase',
                                    letterSpacing: '0.1em', marginBottom: 6,
                                }}>Just starting out?</div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Learn & Earn</h3>
                                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, flex: 1 }}>
                                    Start with a free screener that tells you exactly what's moving. A personal market tutor.
                                </p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                                    {['Daily Signals', 'AI Scores'].map(t => (
                                        <span key={t} className="tag-pill">{t}</span>
                                    ))}
                                </div>
                            </div>

                            {/* PATH 2: Serious Trader (Featured) */}
                            <div className="path-card featured" style={{
                                gridColumn: 'span 4',
                                background: 'linear-gradient(180deg, rgba(14,165,233,0.12) 0%, rgba(15,23,42,0.8) 100%)',
                                border: '1px solid rgba(14,165,233,0.3)', borderRadius: 24, padding: '40px 32px',
                                display: 'flex', flexDirection: 'column', position: 'relative',
                                boxShadow: '0 20px 60px rgba(14,165,233,0.1)',
                                transform: 'translateY(-12px)', zIndex: 2
                            }}>
                                <div className="popular-tag">MOST POPULAR</div>
                                <div style={{ width: 100, height: 100, marginBottom: 20 }}>
                                    <NinjaMaster width={100} height={100} />
                                </div>
                                <div style={{
                                    fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase',
                                    letterSpacing: '0.1em', marginBottom: 6,
                                }}>Ready to get serious?</div>
                                <h3 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Command Center</h3>
                                <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.6, flex: 1 }}>
                                    Real-time scans, Penny stock breakouts, and custom watchlists. Find your edge.
                                </p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
                                    {['Real-time AI', 'Unlimited Scans', 'Penny Breakouts'].map(t => (
                                        <span key={t} className="tag-pill featured">{t}</span>
                                    ))}
                                </div>
                            </div>

                            {/* PATH 3: Capital Manager */}
                            <div className="path-card" style={{
                                gridColumn: 'span 4',
                                background: 'linear-gradient(180deg, rgba(245,158,11,0.06) 0%, rgba(15,23,42,0.6) 100%)',
                                border: '1px solid rgba(245,158,11,0.15)', borderRadius: 20, padding: '32px 24px',
                                display: 'flex', flexDirection: 'column',
                            }}>
                                <div style={{ width: 80, height: 80, marginBottom: 20, opacity: 0.8 }}>
                                    <NinjaDiamond width={80} height={80} />
                                </div>
                                <div style={{
                                    fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase',
                                    letterSpacing: '0.1em', marginBottom: 6,
                                }}>Managing real capital?</div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: '#fbbf24' }}>Elite Access</h3>
                                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, flex: 1 }}>
                                    1-on-1 strategy calls, priority features, and direct input into our roadmap.
                                </p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                                    {['1-on-1 Strategy', 'Early Access'].map(t => (
                                        <span key={t} className="tag-pill gold">{t}</span>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </ScrollSection>

                {/* ═══ SCENE 5: STRIKE / PROOF ═══ */}
                <ScrollSection>
                    <div style={{ textAlign: 'center', position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: 0.04, pointerEvents: 'none', zIndex: 0
                        }}>
                            <span style={{ fontSize: 'clamp(80px, 20vw, 300px)', fontWeight: 950, color: 'white', letterSpacing: '-0.05em' }}>SIGNAL</span>
                        </div>
                        <div style={{
                            width: 'min(500px, 80vw)', height: 'min(500px, 50vh)', position: 'relative', zIndex: 10,
                            filter: 'drop-shadow(0 0 40px rgba(14,165,233,0.4))',
                            animation: 'float 6s ease-in-out infinite',
                        }}>
                            <NinjaHeroVictory width="100%" height="100%" />
                        </div>
                        <h2 style={{
                            fontSize: 'clamp(24px, 4vw, 48px)', fontWeight: 900, color: '#f59e0b',
                            letterSpacing: '0.05em', marginTop: 32,
                        }}>
                            Clear Signal. Decisive Action.
                        </h2>
                    </div>
                </ScrollSection>

                {/* ═══ SCENE 6: SINGLE CTA ═══ */}
                <ScrollSection style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        textAlign: 'center', maxWidth: 800, width: '100%', padding: '60px 24px'
                    }}>
                        <div style={{ width: 140, height: 140, margin: '0 auto 24px' }}>
                            <NinjaSceneVictory width="100%" height="100%" />
                        </div>

                        <h2 style={{
                            fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, marginBottom: 16, lineHeight: 1.1,
                        }}>
                            Start Finding<br /><span className="text-gradient">Your Edge.</span>
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: 18, lineHeight: 1.6, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
                            Free to start. No credit card. Just smarter trading decisions in under 30 seconds.
                        </p>

                        <button onClick={handleGetStarted} className="shine-effect" style={{
                            padding: '18px 56px', fontSize: 18, fontWeight: 800, borderRadius: 14,
                            background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', border: 'none',
                            color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 12,
                            boxShadow: '0 8px 32px rgba(14,165,233,0.35)', transition: 'all 0.3s',
                        }}>
                            Get Started <ArrowRight size={20} />
                        </button>
                    </div>

                    <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#050510' }}>
                        <Footer />
                    </div>
                </ScrollSection>

            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-16px); }
                }
                @keyframes shake {
                    0%, 100% { transform: translate(0,0); }
                    10%, 30%, 50%, 70%, 90% { transform: translate(-2px, 1px); }
                    20%, 40%, 60%, 80% { transform: translate(2px, -1px); }
                }
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
                    40% { transform: translateX(-50%) translateY(-10px); }
                    60% { transform: translateX(-50%) translateY(-5px); }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .text-gradient {
                    background: linear-gradient(135deg, #0ea5e9, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .tag-pill {
                    font-size: 11px;
                    padding: 4px 10px;
                    border-radius: 100px;
                    font-weight: 600;
                    background: rgba(14,165,233,0.1);
                    color: #38bdf8;
                    border: 1px solid rgba(14,165,233,0.2);
                }
                .tag-pill.featured {
                    background: rgba(14,165,233,0.15);
                    color: #7dd3fc;
                    border: 1px solid rgba(14,165,233,0.25);
                }
                .tag-pill.gold {
                    background: rgba(245,158,11,0.1);
                    color: #fbbf24;
                    border: 1px solid rgba(245,158,11,0.2);
                }
                .popular-tag {
                    position: absolute; top: 16px; right: 16px;
                    background: #0ea5e9; color: white;
                    font-size: 10px; font-weight: 700;
                    padding: 3px 10px; border-radius: 100px;
                    letter-spacing: 0.05em;
                }

                /* Responsive Grid for Scenes */
                @media (max-width: 900px) {
                    .paths-grid {
                        display: flex !important;
                        flex-direction: column;
                        gap: 16px !important;
                    }
                    .path-card {
                        grid-column: auto !important;
                    }
                    .path-card.featured {
                        transform: none !important;
                        order: -1; /* Show popular first on mobile */
                    }
                }

                @media (max-width: 768px) {
                    .landing-container {
                        height: calc(100svh - 64px) !important;
                    }
                    .manin-companion { display: none !important; }
                    
                    /* Reset Scroll Behavior for Mobile to be simpler */
                    .scroll-container {
                        scroll-snap-type: y mandatory;
                    }
                    .scroll-section {
                        min-height: 100svh;
                        padding: 60px 20px;
                        height: auto;
                    }
                    
                    /* Scene Grids to Column */
                    .scene-grid {
                        grid-template-columns: 1fr !important;
                        gap: 32px !important;
                        text-align: center;
                    }

                    /* Adjust typography */
                    h1 { font-size: 36px !important; }
                    h2 { font-size: 28px !important; }
                    p { font-size: 16px !important; }

                    /* Fix Footer Section */
                    .scroll-section:last-child {
                        height: auto !important;
                        min-height: auto !important;
                        justify-content: flex-start;
                        padding-top: 40px;
                    }
                }
            `}</style>
        </div>
    );
}
