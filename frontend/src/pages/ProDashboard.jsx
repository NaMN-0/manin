
import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import {
    Activity, Play, Zap, Shield, Target, Award, Terminal
} from 'lucide-react';
import NinjaLoader from '../components/NinjaLoader';
import {
    NinjaAI, NinjaHeadOne, NinjaSlicing, NinjaTarget, NinjaRocket, NinjaSuccess, RandomNinja
} from '../components/NinjaIllustrations';
import StockDetailModal from '../components/StockDetailModal';

export default function ProDashboard() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanLimit, setScanLimit] = useState(50);
    const [selectedStock, setSelectedStock] = useState(null);
    const [logs, setLogs] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // Initial "Work Already Done" simulation
    useEffect(() => {
        const initialLogs = [
            "System initialized...",
            "Connected to NYSE data stream...",
            "Quantum sentiment analysis: ONLINE",
            "Waiting for command sequence..."
        ];
        setLogs(initialLogs);
    }, []);

    async function runScan() {
        if (loading) return;
        setLoading(true);
        setShowResults(false);
        setResults([]);
        setLogs(prev => [...prev, ">> COMMAND RECEIVED: INITIATE SCAN"]);

        // Cinematic scrolling logs
        const scanSteps = [
            "Deploying agents to sectors...",
            "Analyzing volume anomalies...",
            "Filtering noise...",
            "Detecting smart money flow...",
            "Acquiring targets..."
        ];

        let step = 0;
        const logInterval = setInterval(() => {
            if (step < scanSteps.length) {
                const msg = scanSteps[step] || "Processing data packets...";
                setLogs(prev => [...prev.slice(-4), `>> ${msg}`]);
                step++;
            }
        }, 800);

        try {
            const res = await api.get(`/penny/scan?limit=${scanLimit}`);
            clearInterval(logInterval);

            // "Buffer" time to show the cool loader if API is too fast
            setTimeout(() => {
                setResults(res.data.data || []);
                setLoading(false);
                setShowResults(true);
                setLogs(prev => [...prev, `>> SCAN COMPLETE. ${res.data.data?.length || 0} TARGETS FOUND.`]);
            }, 2000); // Enforce at least 2s of visually impressive loading

        } catch (err) {
            clearInterval(logInterval);
            setLoading(false);
            setLogs(prev => [...prev, ">> ERROR: CONNECTION SEVERED"]);
        }
    }

    const profitable = results.filter(r => r.isProfitable);
    const speculative = results.filter(r => !r.isProfitable);

    // Render "Swarm" of Ninjas — interactive squad visualization
    const renderSwarm = () => {
        const count = Math.min(Math.floor(scanLimit / 10), 20);
        const rows = Math.ceil(count / 5);
        return (
            <div style={{
                display: 'grid', gridTemplateColumns: `repeat(${Math.min(count, 5)}, 1fr)`,
                gap: 8, maxWidth: 320, margin: '20px auto', position: 'relative',
            }}>
                {Array.from({ length: count }).map((_, i) => {
                    const intensity = (i / count);
                    const status = i < count * 0.3 ? 'scout' : i < count * 0.7 ? 'scan' : 'strike';
                    const colors = { scout: '#0ea5e9', scan: '#10b981', strike: '#f59e0b' };
                    const labels = { scout: 'SCOUT', scan: 'SCAN', strike: 'STRIKE' };
                    return (
                        <div key={i} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            animation: `swarmPulse 2s ease-in-out ${i * 0.1}s infinite alternate`,
                            cursor: 'default',
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: `radial-gradient(circle, ${colors[status]}22 0%, transparent 70%)`,
                                border: `1px solid ${colors[status]}44`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative', overflow: 'hidden',
                                boxShadow: `0 0 ${12 + i * 2}px ${colors[status]}33`,
                                transition: 'all 0.3s',
                            }}>
                                <RandomNinja width={22} height={22} />
                                {/* Status indicator */}
                                <div style={{
                                    position: 'absolute', bottom: 2, right: 2, width: 6, height: 6,
                                    borderRadius: '50%', background: colors[status],
                                    animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite`,
                                    boxShadow: `0 0 6px ${colors[status]}`,
                                }} />
                            </div>
                            <span style={{
                                fontSize: 7, fontWeight: 700, color: colors[status],
                                letterSpacing: '0.1em', fontFamily: 'monospace', opacity: 0.7,
                            }}>{labels[status]}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="page" style={{ paddingBottom: 80, minHeight: '100vh', background: '#050510' }}>
            <div className="container">

                {/* 1. Header & Live Monitor */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    marginBottom: 40, paddingTop: 20,
                    flexWrap: 'wrap', gap: 16,
                }}>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                        <div className="holo-box">
                            <NinjaAI width={60} height={60} />
                        </div>
                        <div>
                            <h1 style={{
                                fontSize: 32, fontWeight: 900, textTransform: 'uppercase',
                                background: 'linear-gradient(to right, #fff, #99f)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                letterSpacing: '-1px'
                            }}>
                                Command Center
                            </h1>
                            <div style={{ fontFamily: 'monospace', color: 'var(--emerald)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="pulse-dot"></span> SYSTEM ONLINE :: CHANNELS SECURE
                            </div>
                        </div>
                    </div>

                    {/* Live Terminal Log */}
                    <div className="glass-card terminal-window" style={{
                        minWidth: 280, flex: 1, maxWidth: 400, height: 100, padding: 12,
                        fontFamily: 'monospace', fontSize: 10, color: 'var(--primary)',
                        overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        justifyContent: 'flex-end', border: '1px solid var(--primary-dark)'
                    }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ opacity: (i + 1) / logs.length }}>{log}</div>
                        ))}
                    </div>
                </div>

                {/* 2. Control Deck */}
                {!loading && !showResults && (
                    <div className="command-deck" style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', padding: '60px 20px',
                        background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.05) 0%, transparent 70%)',
                        border: '1px solid var(--ninja-border)', borderRadius: 24,
                        marginBottom: 40
                    }}>
                        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Initialize Scan Protocol</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 30 }}>Select Universe Breadth</p>

                        {/* Slider */}
                        <div style={{ width: '100%', maxWidth: 400, marginBottom: 20 }}>
                            <input
                                type="range" min={20} max={200} step={10}
                                value={scanLimit}
                                onChange={e => setScanLimit(Number(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                                <span>RECON</span>
                                <span>DEEP DIVE</span>
                            </div>
                        </div>

                        {/* The Swarm Visualization */}
                        <div style={{ marginBottom: 30, textAlign: 'center' }}>
                            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--primary)', marginBottom: 8 }}>
                                Agents Ready: {Math.floor(scanLimit / 10)} SQUADS
                            </div>
                            {renderSwarm()}
                        </div>

                        <button
                            className="btn btn-primary btn-xl glow-effect"
                            onClick={runScan}
                            style={{
                                padding: '16px 48px', fontSize: 18, fontWeight: 900, letterSpacing: '1px',
                                background: 'var(--primary)', boxShadow: '0 0 30px var(--primary-glow)',
                                width: '100%', maxWidth: 320,
                            }}
                        >
                            INITIATE
                        </button>
                    </div>
                )}

                {/* 3. Loading Phase — Active Agent Visualization */}
                {loading && (
                    <div style={{
                        padding: '40px 20px', borderRadius: 24,
                        background: 'radial-gradient(ellipse at center, rgba(14,165,233,0.05) 0%, transparent 70%)',
                        border: '1px solid var(--ninja-border)',
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                                Agents Deployed
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Scanning {scanLimit} targets in parallel</p>
                        </div>

                        {/* Agent Activity Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
                            {[
                                { name: 'Volume Tracker', status: 'Analyzing flow patterns...', icon: NinjaTarget, color: '#0ea5e9' },
                                { name: 'Momentum Scout', status: 'Detecting breakout signals...', icon: NinjaRocket, color: '#10b981' },
                                { name: 'Risk Sentinel', status: 'Evaluating downside...', icon: NinjaSlicing, color: '#ef4444' },
                                { name: 'Alpha Hunter', status: 'Locking on targets...', icon: NinjaSuccess, color: '#f59e0b' },
                            ].map((agent, i) => (
                                <div key={i} style={{
                                    background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 16,
                                    border: `1px solid ${agent.color}22`, position: 'relative', overflow: 'hidden',
                                }}>
                                    {/* Scanning line animation */}
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                        background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`,
                                        animation: `scanLine 2s ${i * 0.5}s ease-in-out infinite`,
                                    }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: `${agent.color}15`, border: `1px solid ${agent.color}33`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <agent.icon width={20} height={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: agent.color }}>{agent.name}</div>
                                            <div style={{
                                                fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace',
                                                animation: `typing 3s ${i * 0.7}s steps(30) infinite`,
                                                overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 140,
                                            }}>{agent.status}</div>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', background: agent.color, borderRadius: 2,
                                            animation: `progress 3s ${i * 0.4}s ease-in-out infinite`,
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Central visualization */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 80, height: 80, margin: '0 auto 16px',
                                animation: 'float 3s ease-in-out infinite',
                                filter: 'drop-shadow(0 0 20px rgba(14,165,233,0.4))',
                            }}>
                                <NinjaAI width={80} height={80} />
                            </div>
                            <div style={{
                                fontFamily: 'monospace', fontSize: 11, color: 'var(--primary)', letterSpacing: '1px',
                                animation: 'blink 1.5s step-end infinite',
                            }}>
                                PROCESSING...
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Results Phase */}
                {showResults && (
                    <div className="results-grid animate-enter">
                        {/* Quick Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
                            <StatBox label="Total Scanned" value={results.length} icon={NinjaHeadOne} color="var(--text-primary)" />
                            <StatBox label="Profitable" value={profitable.length} icon={NinjaSuccess} color="var(--emerald)" />
                            <StatBox label="High Potential" value={speculative.length} icon={NinjaRocket} color="var(--crimson)" />
                            <StatBox label="Top Score" value={Math.max(...results.map(r => r.score))} icon={NinjaTarget} color="var(--sky)" />
                        </div>

                        {/* Main Lists */}
                        {profitable.length > 0 && (
                            <Section title="Profitable Gems (Founding Alpha)" icon={Award} color="var(--emerald)">
                                <div className="card-grid">
                                    {profitable.map((stock, i) => (
                                        <StockResultCard key={i} stock={stock} onSelect={() => setSelectedStock(stock)} highlight />
                                    ))}
                                </div>
                            </Section>
                        )}

                        {speculative.length > 0 && (
                            <Section title="High Risk / High Reward (Moonshots)" icon={Zap} color="var(--crimson)">
                                <div className="card-grid">
                                    {speculative.map((stock, i) => (
                                        <StockResultCard key={i} stock={stock} onSelect={() => setSelectedStock(stock)} />
                                    ))}
                                </div>
                            </Section>
                        )}

                        <div style={{ textAlign: 'center', marginTop: 40 }}>
                            <button onClick={() => setShowResults(false)} className="btn btn-secondary">
                                New Scan
                            </button>
                        </div>
                    </div>
                )}

                {selectedStock && (
                    <StockDetailModal
                        ticker={selectedStock.ticker}
                        initialData={selectedStock}
                        onClose={() => setSelectedStock(null)}
                    />
                )}
            </div>

            <style>{`
                .holo-box {
                    filter: drop-shadow(0 0 10px var(--primary-glow));
                }
                .pulse-dot {
                    width: 8px; height: 8px; background: var(--success);
                    border-radius: 50%; box-shadow: 0 0 5px var(--success);
                    animation: pulse 2s infinite;
                }
                .swarmer {
                    animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
                }
                .glow-effect:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 50px var(--primary-glow) !important;
                }
                .animate-enter {
                    animation: fadeUp 0.6s ease-out;
                }
                .card-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;
                }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                @keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes fadeUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes swarmPulse { from { transform: scale(1); } to { transform: scale(1.08); } }
                @keyframes scanLine {
                    0% { transform: translateX(-100%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateX(100%); opacity: 0; }
                }
                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 85%; }
                    70% { width: 90%; }
                    100% { width: 95%; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes typing {
                    0% { max-width: 0; } 
                    80% { max-width: 140px; }
                    100% { max-width: 140px; }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                @media (max-width: 768px) {
                    .card-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .command-deck {
                        padding: 32px 16px !important;
                    }
                }
            `}</style>
        </div>
    );
}

const StatBox = ({ label, value, icon: Icon, color }) => (
    <div className="glass-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, borderLeft: `4px solid ${color}` }}>
        <div style={{ opacity: 0.8 }}><Icon width={40} height={40} /></div>
        <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: color }}>{value}</div>
        </div>
    </div>
);

const Section = ({ title, icon: Icon, children, color }) => (
    <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: color }}>
            <Icon size={24} /> {title}
        </h2>
        {children}
    </div>
);

function StockResultCard({ stock, onSelect, highlight = false }) {
    const isUp = stock.upside > 0;
    return (
        <div className="glass-card stock-card-interactive" onClick={onSelect} style={{
            cursor: 'pointer', padding: 20, position: 'relative', overflow: 'hidden',
            border: highlight ? `1px solid ${isUp ? 'var(--emerald)' : 'var(--crimson)'}` : undefined
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace' }}>{stock.ticker}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Score: {stock.score}/10</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>${stock.price}</div>
                    <div style={{ color: isUp ? 'var(--emerald)' : 'var(--crimson)', fontWeight: 700 }}>
                        {isUp ? '+' : ''}{stock.upside}%
                    </div>
                </div>
            </div>

            {/* AI Insight */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>AI Target:</span>
                <span style={{ color: 'var(--sky)', fontWeight: 700 }}>${stock.predicted}</span>
            </div>
        </div>
    );
}
