
import { useState, useEffect, useRef } from 'react';
import { NinjaAI, NinjaSceneAlgo, NinjaTarget, NinjaSuccess } from './NinjaIllustrations';
import { Shield, Zap, BarChart2, Radio, CheckCircle2 } from 'lucide-react';

const PHASES = [
    { label: 'Initializing Quantum Core...', icon: Shield, duration: 1500 },
    { label: 'Connecting Data Streams...', icon: Radio, duration: 1200 },
    { label: 'Deploying AI Agents...', icon: Zap, duration: 1800 },
    { label: 'Calibrating Scanner Matrix...', icon: BarChart2, duration: 1400 },
    { label: 'Command Center ONLINE.', icon: CheckCircle2, duration: 1000 },
];

export default function CommandCenterConstruction({ onComplete }) {
    const [phase, setPhase] = useState(0);
    const [progress, setProgress] = useState(0);
    const [gridOpacity, setGridOpacity] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ experience: '', goals: '', risk_tolerance: 'medium' });
    const canvasRef = useRef(null);

    // Grid construction animation
    useEffect(() => {
        let elapsed = 0;
        const totalDuration = PHASES.reduce((sum, p) => sum + p.duration, 0);
        let currentPhase = 0;
        let phaseElapsed = 0;

        const timer = setInterval(() => {
            elapsed += 50;
            phaseElapsed += 50;
            setProgress(Math.min(100, (elapsed / totalDuration) * 100));
            setGridOpacity(Math.min(1, elapsed / (totalDuration * 0.5)));

            if (phaseElapsed >= PHASES[currentPhase].duration && currentPhase < PHASES.length - 1) {
                currentPhase++;
                phaseElapsed = 0;
                setPhase(currentPhase);
            }

            if (elapsed >= totalDuration) {
                clearInterval(timer);
                setTimeout(() => setShowForm(true), 500);
            }
        }, 50);

        return () => clearInterval(timer);
    }, []);

    // Data stream canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const streams = Array.from({ length: 15 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 1 + Math.random() * 3,
            length: 20 + Math.random() * 60,
        }));

        let raf;
        const draw = () => {
            ctx.fillStyle = 'rgba(5,5,16,0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            streams.forEach(s => {
                ctx.strokeStyle = `rgba(14,165,233,${0.3 + Math.random() * 0.4})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x, s.y + s.length);
                ctx.stroke();
                s.y += s.speed;
                if (s.y > canvas.height) { s.y = -s.length; s.x = Math.random() * canvas.width; }
            });
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(raf);
    }, []);

    const handleSubmit = () => {
        onComplete(formData);
    };

    const PhaseIcon = PHASES[phase]?.icon || Shield;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#050510', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
        }}>
            {/* Data Stream Background */}
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, opacity: gridOpacity * 0.4 }} />

            {/* Grid Lines */}
            <div style={{
                position: 'absolute', inset: 0, opacity: gridOpacity * 0.15,
                backgroundImage: `linear-gradient(rgba(14,165,233,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.3) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
            }} />

            {!showForm ? (
                /* CONSTRUCTION PHASE */
                <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 500 }}>
                    {/* Central Ninja */}
                    <div style={{
                        width: 200, height: 200, margin: '0 auto 30px',
                        filter: 'drop-shadow(0 0 30px rgba(14,165,233,0.5))',
                        animation: 'pulse 2s ease-in-out infinite',
                    }}>
                        <NinjaAI width={200} height={200} />
                    </div>

                    {/* Phase Label */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
                        <PhaseIcon size={20} color="#0ea5e9" />
                        <span style={{ fontFamily: 'monospace', fontSize: 16, color: '#0ea5e9', fontWeight: 700 }}>
                            {PHASES[phase].label}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                        width: '100%', height: 6, background: 'rgba(30,41,59,0.8)',
                        borderRadius: 3, overflow: 'hidden', marginBottom: 16,
                    }}>
                        <div style={{
                            width: `${progress}%`, height: '100%',
                            background: 'linear-gradient(90deg, #0ea5e9, #10b981)',
                            borderRadius: 3, transition: 'width 0.3s',
                            boxShadow: '0 0 10px rgba(14,165,233,0.5)',
                        }} />
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>
                        {Math.round(progress)}% COMPLETE
                    </span>
                </div>
            ) : (
                /* DATA COLLECTION PHASE */
                <div style={{
                    position: 'relative', zIndex: 10, maxWidth: 480, width: '100%', padding: 32,
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(14,165,233,0.2)',
                    borderRadius: 20, backdropFilter: 'blur(20px)',
                    animation: 'fadeIn 0.5s ease-out',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ width: 48, height: 48 }}>
                            <NinjaSuccess width={48} height={48} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: 0 }}>Command Center Ready</h2>
                            <p style={{ fontSize: 12, color: '#10b981', margin: 0, fontFamily: 'monospace' }}>ALL SYSTEMS OPERATIONAL</p>
                        </div>
                    </div>

                    <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
                        Help KAGE AI personalize your experience. Quick setup — takes 30 seconds.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>
                                Trading Experience
                            </label>
                            <select value={formData.experience} onChange={e => setFormData(p => ({ ...p, experience: e.target.value }))}
                                style={{
                                    width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)',
                                    borderRadius: 8, color: 'white', fontSize: 14, outline: 'none',
                                }}>
                                <option value="">Select...</option>
                                <option value="beginner">Less than 1 year</option>
                                <option value="intermediate">1-3 years</option>
                                <option value="advanced">3+ years</option>
                                <option value="professional">Professional / Full-time</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>
                                Risk Tolerance
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {['low', 'medium', 'high'].map(level => (
                                    <button key={level} onClick={() => setFormData(p => ({ ...p, risk_tolerance: level }))}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                            border: formData.risk_tolerance === level ? '2px solid #0ea5e9' : '1px solid rgba(148,163,184,0.2)',
                                            background: formData.risk_tolerance === level ? 'rgba(14,165,233,0.1)' : '#0f172a',
                                            color: formData.risk_tolerance === level ? '#0ea5e9' : '#94a3b8',
                                            cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s',
                                        }}>
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>
                                What's your main goal?
                            </label>
                            <input type="text" value={formData.goals} onChange={e => setFormData(p => ({ ...p, goals: e.target.value }))}
                                placeholder="e.g., Build long-term wealth, Day trading income..."
                                style={{
                                    width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)',
                                    borderRadius: 8, color: 'white', fontSize: 14, outline: 'none',
                                }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                        <button onClick={() => onComplete(null)} style={{
                            flex: 1, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                            background: 'transparent', border: '1px solid rgba(148,163,184,0.2)', color: '#64748b', cursor: 'pointer',
                        }}>
                            Skip for now
                        </button>
                        <button onClick={handleSubmit} style={{
                            flex: 2, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 800,
                            background: '#0ea5e9', border: 'none', color: '#fff', cursor: 'pointer',
                            boxShadow: '0 0 20px rgba(14,165,233,0.3)',
                        }}>
                            Launch Command Center
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
