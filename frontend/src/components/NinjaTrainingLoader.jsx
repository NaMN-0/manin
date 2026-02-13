import { useState, useEffect, useRef } from 'react';
import { NinjaMeditating } from './NinjaIllustrations';
import { Sparkles } from 'lucide-react';

export default function NinjaTrainingLoader({ text = "Training Models..." }) {
    const [score, setScore] = useState(0);
    const [orbs, setOrbs] = useState([]);
    const [message, setMessage] = useState(text);
    const containerRef = useRef(null);

    // Spawn orbs randomly
    useEffect(() => {
        const interval = setInterval(() => {
            if (orbs.length < 3) {
                const id = Date.now();
                const x = Math.random() * 80 + 10; // 10% to 90%
                const y = Math.random() * 80 + 10;
                setOrbs(prev => [...prev, { id, x, y }]);
            }
        }, 800);
        return () => clearInterval(interval);
    }, [orbs.length]);

    const collectOrb = (id, e) => {
        e.stopPropagation();
        setOrbs(prev => prev.filter(o => o.id !== id));
        setScore(s => s + 1);

        // Encouraging messages
        const messages = ["Focus Sharpened!", "Chi Gathering...", "Market Insight +1", "Keep Going!"];
        setMessage(messages[Math.floor(Math.random() * messages.length)]);

        // Reset message after delay
        setTimeout(() => setMessage(text), 1500);
    };

    return (
        <div ref={containerRef} style={{
            position: 'relative',
            minHeight: 400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            userSelect: 'none'
        }}>
            {/* Meditating Ninja */}
            <div style={{ position: 'relative', zIndex: 10, animation: 'float 3s ease-in-out infinite' }}>
                <NinjaMeditating width={150} height={150} />
                {score > 0 && (
                    <div style={{
                        position: 'absolute', top: -30, width: '100%', textAlign: 'center',
                        color: 'var(--emerald)', fontWeight: 800, fontSize: 18,
                        textShadow: '0 0 10px var(--emerald-glow)',
                        animation: 'fadeUp 0.5s ease-out'
                    }}>
                        +{score} Chi
                    </div>
                )}
            </div>

            {/* Status Text */}
            <div style={{
                marginTop: 30,
                zIndex: 10,
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: 20, fontWeight: 700, color: 'var(--text-primary)',
                    marginBottom: 8, minHeight: 30
                }}>
                    {message}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Tap the orbs to focus your energy
                </div>
            </div>

            {/* Floating Orbs */}
            {orbs.map(orb => (
                <div
                    key={orb.id}
                    onClick={(e) => collectOrb(orb.id, e)}
                    style={{
                        position: 'absolute',
                        top: `${orb.y}%`,
                        left: `${orb.x}%`,
                        width: 40,
                        height: 40,
                        cursor: 'pointer',
                        zIndex: 20,
                        filter: 'drop-shadow(0 0 10px var(--primary))',
                        animation: 'pulse 1s infinite alternate'
                    }}
                >
                    <div style={{
                        width: '100%', height: '100%',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 30% 30%, white, var(--primary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Sparkles size={20} color="white" />
                    </div>
                </div>
            ))}

            <style>{`
                @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }
                @keyframes pulse { from { transform: scale(1); opacity: 0.8; } to { transform: scale(1.1); opacity: 1; } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
