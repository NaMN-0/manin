import { useState, useEffect, useRef } from 'react';
import { NinjaMeditating } from './NinjaIllustrations';
import { Sparkles, TrendingUp, TrendingDown, Scissors } from 'lucide-react';

export default function NinjaTrainingLoader({ text = "Training Models..." }) {
    const [score, setScore] = useState(0);
    const [targets, setTargets] = useState([]);
    const [slashes, setSlashes] = useState([]);
    const [message, setMessage] = useState(text);
    const containerRef = useRef(null);

    // Spawn targets randomly (Candlesticks/Price Bubbles)
    useEffect(() => {
        const interval = setInterval(() => {
            if (targets.length < 5) {
                const id = Date.now();
                const x = Math.random() * 80 + 10;
                const y = Math.random() * 80 + 10;
                const type = Math.random() > 0.5 ? 'up' : 'down';
                setTargets(prev => [...prev, { id, x, y, type }]);
            }
        }, 600);
        return () => clearInterval(interval);
    }, [targets.length]);

    const collectTarget = (id, x, y, e) => {
        e.stopPropagation();
        setTargets(prev => prev.filter(t => t.id !== id));
        setScore(s => s + 100);

        // Add slash effect
        const slashId = Date.now();
        setSlashes(prev => [...prev, { id: slashId, x, y }]);
        setTimeout(() => {
            setSlashes(prev => prev.filter(s => s.id !== slashId));
        }, 400);

        // Encouraging messages
        const messages = ["Market Sliced!", "Found Alpha!", "Pattern Detected!", "Trend Mastered!"];
        setMessage(messages[Math.floor(Math.random() * messages.length)]);

        // Reset message after delay
        setTimeout(() => setMessage(text), 1500);
    };

    return (
        <div ref={containerRef} style={{
            position: 'relative',
            minHeight: 450,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            userSelect: 'none',
            background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.05) 0%, transparent 70%)',
            borderRadius: 24
        }}>
            {/* Score HUD */}
            <div style={{
                position: 'absolute', top: 20, right: 30, textAlign: 'right',
                background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: 12,
                border: '1px solid var(--ninja-border)', backdropFilter: 'blur(10px)'
            }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Alpha Profit</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                    ${score.toLocaleString()}
                </div>
            </div>

            {/* Meditating Ninja */}
            <div style={{ position: 'relative', zIndex: 10, animation: 'float 4s ease-in-out infinite' }}>
                <NinjaMeditating width={180} height={180} />
            </div>

            {/* Status Text - Fixed Height to prevent jumpiness */}
            <div style={{
                zIndex: 10,
                textAlign: 'center',
                height: 64,
                width: 300,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <div style={{
                    fontSize: 22, fontWeight: 800, color: 'var(--text-primary)',
                    letterSpacing: -0.5,
                    lineHeight: 1.2
                }}>
                    {message}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                    <Scissors size={14} /> Slice the volatility to train
                </div>
            </div>

            {/* Market Targets */}
            {targets.map(target => (
                <div
                    key={target.id}
                    onClick={(e) => collectTarget(target.id, target.x, target.y, e)}
                    className="market-target"
                    style={{
                        position: 'absolute',
                        top: `${target.y}%`,
                        left: `${target.x}%`,
                        width: 44,
                        height: 44,
                        cursor: 'pointer',
                        zIndex: 20,
                        animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                >
                    <div style={{
                        width: '100%', height: '100%',
                        borderRadius: 10,
                        background: target.type === 'up' ? 'var(--emerald)' : 'var(--crimson)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 0 20px ${target.type === 'up' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                        border: '2px solid rgba(255,255,255,0.2)'
                    }}>
                        {target.type === 'up' ? <TrendingUp size={22} color="white" /> : <TrendingDown size={22} color="white" />}
                    </div>
                </div>
            ))}

            {/* Slash Effects */}
            {slashes.map(slash => (
                <div
                    key={slash.id}
                    style={{
                        position: 'absolute',
                        top: `${slash.y}%`,
                        left: `${slash.x}%`,
                        width: 80,
                        height: 2,
                        background: 'white',
                        boxShadow: '0 0 10px white, 0 0 20px var(--primary)',
                        zIndex: 30,
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                        pointerEvents: 'none',
                        animation: 'slash 0.4s ease-out forwards'
                    }}
                />
            ))}

            <style>{`
                @keyframes float { 
                    0%, 100% { transform: translateY(0); } 
                    50% { transform: translateY(-15px); } 
                }
                @keyframes popIn {
                    from { transform: scale(0); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes slash {
                    0% { transform: translate(-50%, -50%) rotate(-45deg) scaleX(0); opacity: 1; }
                    100% { transform: translate(-50%, -50%) rotate(-45deg) scaleX(1.5); opacity: 0; }
                }
                .market-target:hover {
                    transform: scale(1.1) !important;
                    filter: brightness(1.2);
                }
            `}</style>
        </div>
    );
}
