
import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
    Activity, Play, Zap, Shield, Target, Award, Terminal, BrainCircuit, Search
} from 'lucide-react';
import NinjaLoader from '../components/NinjaLoader';
import NewsIntelligence from '../components/NewsIntelligence';
import {
    NinjaAI, NinjaHeadOne, NinjaSlicing, NinjaTarget, NinjaRocket, NinjaSuccess, RandomNinja
} from '../components/NinjaIllustrations';
import StockDetailModal from '../components/StockDetailModal';

import { usePostHog } from 'posthog-js/react';

export default function ProDashboard() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanLimit, setScanLimit] = useState(50);
    const [selectedStock, setSelectedStock] = useState(null);
    const [logs, setLogs] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [activeTab, setActiveTab] = useState('scan'); // 'scan' or 'intelligence'
    const [newsResults, setNewsResults] = useState([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [trialExpired, setTrialExpired] = useState(false);
    const { user, checkProStatus } = useAuth();
    const posthog = usePostHog();

    const [selectedTickers, setSelectedTickers] = useState(new Set());
    const [showNewsModal, setShowNewsModal] = useState(false);

    // Toggle selection
    const toggleTicker = (ticker) => {
        const newSet = new Set(selectedTickers);
        if (newSet.has(ticker)) {
            newSet.delete(ticker);
        } else {
            if (newSet.size >= 20) return; // Limit to 20
            newSet.add(ticker);
        }
        setSelectedTickers(newSet);
    };

    // Initial "Work Already Done" simulation
    useEffect(() => {
        posthog?.capture('viewed_pro_dashboard');
        const initialLogs = [
            "System initialized...",
            "Connected to NYSE data stream...",
            "Quantum sentiment analysis: ONLINE",
            "Waiting for command sequence..."
        ];
        setLogs(initialLogs);
    }, [posthog]);

    async function runScan() {
        if (loading) return;
        setLoading(true);
        setShowResults(true);
        setResults([]);
        setLogs(prev => [...prev, ">> COMMAND RECEIVED: INITIATE SCAN SEQUENCE"]);

        const BATCH_SIZE = 10;
        let offset = 0;
        let totalFetched = 0;
        let consecutiveEmptyBatches = 0;

        try {
            while (totalFetched < scanLimit && consecutiveEmptyBatches < 3) {
                setLogs(prev => [...prev.slice(-4), `>> Scanning sector block ${offset}...`]);

                const res = await api.get(`/penny/scan_batch?limit=${BATCH_SIZE}&offset=${offset}`);
                const newData = res.data.data || [];

                if (newData.length > 0) {
                    setResults(prev => {
                        const combined = [...prev, ...newData];
                        return combined.sort((a, b) => (b.isProfitable ? 1 : 0) - (a.isProfitable ? 1 : 0) || b.upside - a.upside);
                    });
                    totalFetched += newData.length;
                    consecutiveEmptyBatches = 0;
                } else {
                    consecutiveEmptyBatches++;
                }
                offset += BATCH_SIZE;
                await new Promise(r => setTimeout(r, 200));
            }
            setLogs(prev => [...prev, `>> SCAN COMPLETE. ${totalFetched} TARGETS ACQUIRED.`]);
        } catch (err) {
            console.error(err);
            setLogs(prev => [...prev, ">> ERROR: DATA STREAM INTERRUPTED"]);
            if (err.response?.status === 403) setTrialExpired(true);
        } finally {
            setLoading(false);
            checkProStatus?.();
        }
    }

    async function runBatchAnalysis() {
        if (newsLoading || selectedTickers.size === 0) return;
        setNewsLoading(true);
        setShowNewsModal(true);
        try {
            const res = await api.post('/news/batch', {
                tickers: Array.from(selectedTickers)
            });
            if (res.data?.status === 'ok') {
                setNewsResults(res.data.data);
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 403) {
                setTrialExpired(true);
                setShowNewsModal(false);
            }
        } finally {
            setNewsLoading(false);
            checkProStatus?.();
        }
    }

    const profitable = results.filter(r => r.isProfitable);
    const speculative = results.filter(r => !r.isProfitable);

    const renderSwarm = () => {
        const count = Math.min(Math.floor(scanLimit / 10), 20);
        return (
            <div style={{
                display: 'grid', gridTemplateColumns: `repeat(${Math.min(count, 5)}, 1fr)`,
                gap: 8, maxWidth: 320, margin: '20px auto', position: 'relative',
            }}>
                {Array.from({ length: count }).map((_, i) => {
                    const status = i < count * 0.3 ? 'scout' : i < count * 0.7 ? 'scan' : 'strike';
                    const colors = { scout: '#0ea5e9', scan: '#10b981', strike: '#f59e0b' };
                    const labels = { scout: 'SCOUT', scan: 'SCAN', strike: 'STRIKE' };
                    return (
                        <div key={i} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            animation: `swarmPulse 2s ease-in-out ${i * 0.1}s infinite alternate`,
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: `radial-gradient(circle, ${colors[status]}22 0%, transparent 70%)`,
                                border: `1px solid ${colors[status]}44`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative', overflow: 'hidden',
                                boxShadow: `0 0 ${12 + i * 2}px ${colors[status]}33`,
                            }}>
                                <RandomNinja width={22} height={22} />
                                <div style={{
                                    position: 'absolute', bottom: 2, right: 2, width: 6, height: 6,
                                    borderRadius: '50%', background: colors[status],
                                    animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite`,
                                    boxShadow: `0 0 6px ${colors[status]}`,
                                }} />
                            </div>
                            <span style={{ fontSize: 7, fontWeight: 700, color: colors[status], fontFamily: 'monospace', opacity: 0.7 }}>{labels[status]}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div id="pro-dashboard-page" className="page" style={{ paddingBottom: 80, minHeight: '100vh', background: '#050510' }}>
            <div className="container" style={{ padding: '0 20px' }}>

                {/* 1. Header & Live Monitor */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    marginBottom: 40, paddingTop: 20, flexWrap: 'wrap', gap: 16,
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
                            }}>Command Center</h1>
                            <div style={{ fontFamily: 'monospace', color: 'var(--emerald)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="pulse-dot"></span> SYSTEM ONLINE :: CHANNELS SECURE
                            </div>
                        </div>
                    </div>

                    <div className="glass-card terminal-window" style={{
                        minWidth: 280, flex: 1, maxWidth: 400, height: 100, padding: 12,
                        fontFamily: 'monospace', fontSize: 10, color: 'var(--primary)',
                        overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        justifyContent: 'flex-end', border: '1px solid var(--primary-dark)'
                    }}>
                        {logs.slice(-6).map((log, i) => (
                            <div key={i} style={{ opacity: (i + 1) / 6 }}>{log}</div>
                        ))}
                    </div>
                </div>

                {/* Trial Expired / Pro Upgrade Wall */}
                {trialExpired ? (
                    <div className="animate-enter" style={{
                        marginTop: 40, padding: 40, borderRadius: 24, textAlign: 'center',
                        background: 'linear-gradient(180deg, rgba(239,68,68,0.05) 0%, rgba(15,23,42,0.9) 100%)',
                        border: '1px solid var(--crimson)',
                    }}>
                        <Shield size={64} color="var(--crimson)" style={{ marginBottom: 20 }} />
                        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Free Trial Expired</h2>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 32px', fontSize: 16 }}>
                            You've experienced the power of KAGE AI. Access to deep scanners and
                            intelligence channels now requires a Pro subscription.
                        </p>
                        <button
                            className="btn btn-primary btn-xl glow-effect"
                            style={{ padding: '16px 48px', minWidth: 260 }}
                            onClick={() => window.location.href = '/plans'}
                        >
                            Get Lifetime Pro — ₹999
                        </button>
                    </div>
                ) : (
                    <>
                        {/* 2. Control Deck */}
                        {activeTab === 'scan' && !loading && !showResults && (
                            <div className="command-deck" style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', padding: '60px 20px',
                                background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.05) 0%, transparent 70%)',
                                border: '1px solid var(--ninja-border)', borderRadius: 24,
                                marginBottom: 40
                            }}>
                                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Initialize Scan Protocol</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 30 }}>Select Universe Breadth</p>
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
                                <div style={{ marginBottom: 30, textAlign: 'center' }}>
                                    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--primary)', marginBottom: 8 }}>
                                        Agents Ready: {Math.floor(scanLimit / 10)} SQUADS
                                    </div>
                                    {renderSwarm()}
                                </div>
                                <button className="btn btn-primary btn-xl glow-effect" onClick={runScan} style={{ padding: '16px 48px', fontSize: 18, fontWeight: 900, width: '100%', maxWidth: 320 }}>INITIATE</button>
                            </div>
                        )}

                        {/* 3. Loading Phase */}
                        {activeTab === 'scan' && loading && (
                            <div style={{ padding: '40px 20px', borderRadius: 24, background: 'radial-gradient(ellipse at center, rgba(14,165,233,0.05) 0%, transparent 70%)', border: '1px solid var(--ninja-border)' }}>
                                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase' }}>Agents Deployed</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Scanning {scanLimit} targets in parallel</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
                                    {[
                                        { name: 'Volume Tracker', status: 'Analyzing flow patterns...', icon: NinjaTarget, color: '#0ea5e9' },
                                        { name: 'Momentum Scout', status: 'Detecting breakout signals...', icon: NinjaRocket, color: '#10b981' },
                                        { name: 'Risk Sentinel', status: 'Evaluating downside...', icon: NinjaSlicing, color: '#ef4444' },
                                        { name: 'Alpha Hunter', status: 'Locking on targets...', icon: NinjaSuccess, color: '#f59e0b' },
                                    ].map((agent, i) => (
                                        <div key={i} style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 16, border: `1px solid ${agent.color}22`, position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`, animation: `scanLine 2s ${i * 0.5}s ease-in-out infinite` }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${agent.color}15`, border: `1px solid ${agent.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <agent.icon width={20} height={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: agent.color }}>{agent.name}</div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 140 }}>{agent.status}</div>
                                                </div>
                                            </div>
                                            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', background: agent.color, borderRadius: 2, animation: `progress 3s ${i * 0.4}s ease-in-out infinite` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: 80, height: 80, margin: '0 auto 16px', animation: 'float 3s ease-in-out infinite', filter: 'drop-shadow(0 0 20px rgba(14,165,233,0.4))' }}><NinjaAI width={80} height={80} /></div>
                                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--primary)', letterSpacing: '1px', animation: 'blink 1.5s step-end infinite' }}>PROCESSING...</div>
                                </div>
                            </div>
                        )}

                        {/* 4. Results Phase */}
                        {activeTab === 'scan' && showResults && (
                            <div className="results-grid animate-enter">
                                {/* Batch Analysis Controls */}
                                <div className="sentiment-sticky-bar" style={{
                                    position: 'sticky', top: 'calc(var(--banner-height, 0px) + 84px)', zIndex: 100,
                                    background: 'rgba(5, 5, 16, 0.95)', backdropFilter: 'blur(10px)',
                                    borderRadius: 16, padding: '12px 24px', border: '1px solid var(--primary-dark)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    marginBottom: 30, boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                }}>
                                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                                        Select stocks for <span className="text-primary font-bold">Deep Sentiment Analysis</span>
                                        {selectedTickers.size > 0 && <span style={{ marginLeft: 10, color: 'white', fontWeight: 700 }}>{selectedTickers.size} selected</span>}
                                    </div>
                                    <div>
                                        {selectedTickers.size > 0 ? (
                                            <button
                                                className="btn btn-primary"
                                                onClick={runBatchAnalysis}
                                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                            >
                                                <BrainCircuit size={16} /> Analyze Sentiment
                                            </button>
                                        ) : (
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Select up to 20 tickers</div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
                                    <StatBox label="Total Scanned" value={results.length} icon={NinjaHeadOne} color="var(--text-primary)" />
                                    <StatBox label="Profitable" value={profitable.length} icon={NinjaSuccess} color="var(--emerald)" />
                                    <StatBox label="High Potential" value={speculative.length} icon={NinjaRocket} color="var(--crimson)" />
                                    <StatBox label="Top Score" value={results.length > 0 ? Math.max(...results.map(r => r.score)) : 0} icon={NinjaTarget} color="var(--sky)" />
                                </div>
                                {profitable.length > 0 && (
                                    <Section title="Profitable Gems (Founding Alpha)" icon={Award} color="var(--emerald)">
                                        <div className="card-grid">
                                            {profitable.map((stock, i) => (
                                                <StockResultCard
                                                    key={i}
                                                    stock={stock}
                                                    onSelect={() => setSelectedStock(stock)}
                                                    highlight
                                                    selected={selectedTickers.has(stock.ticker)}
                                                    onToggleSelect={() => toggleTicker(stock.ticker)}
                                                />
                                            ))}
                                        </div>
                                    </Section>
                                )}
                                {speculative.length > 0 && (
                                    <Section title="High Risk / High Reward (Moonshots)" icon={Zap} color="var(--crimson)">
                                        <div className="card-grid">
                                            {speculative.map((stock, i) => (
                                                <StockResultCard
                                                    key={i}
                                                    stock={stock}
                                                    onSelect={() => setSelectedStock(stock)}
                                                    selected={selectedTickers.has(stock.ticker)}
                                                    onToggleSelect={() => toggleTicker(stock.ticker)}
                                                />
                                            ))}
                                        </div>
                                    </Section>
                                )}
                                <div style={{ textAlign: 'center', marginTop: 40 }}>
                                    <button onClick={() => { setShowResults(false); setSelectedTickers(new Set()); }} className="btn btn-secondary">New Scan</button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* News Intelligence Modal */}
                {showNewsModal && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4
                    }}>
                        <div className="glass-card" style={{
                            width: '90%', maxWidth: 1000, maxHeight: '90vh', overflowY: 'auto',
                            position: 'relative', border: '1px solid var(--primary-dark)',
                            boxShadow: '0 0 50px rgba(14, 165, 233, 0.2)'
                        }}>
                            <div style={{
                                position: 'sticky', top: 0, zIndex: 10, background: '#0f172a',
                                padding: '20px', borderBottom: '1px solid var(--ninja-border)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>Sentiment Analysis Results</h2>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button className="btn btn-secondary" onClick={() => {
                                        setNewsResults([]);
                                        runBatchAnalysis();
                                    }}>Refresh</button>
                                    <button className="btn btn-primary" onClick={() => setShowNewsModal(false)}>Close</button>
                                </div>
                            </div>
                            <div style={{ padding: 20 }}>
                                <NewsIntelligence data={newsResults} loading={newsLoading} />
                            </div>
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
                #pro-dashboard-page .holo-box { filter: drop-shadow(0 0 10px var(--primary-glow)); }
                #pro-dashboard-page .pulse-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; box-shadow: 0 0 5px var(--success); animation: pulse 2s infinite; }
                #pro-dashboard-page .glow-effect:hover { transform: scale(1.05); box-shadow: 0 0 50px var(--primary-glow) !important; }
                #pro-dashboard-page .animate-enter { animation: fadeUp 0.6s ease-out; }
                #pro-dashboard-page .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                @keyframes fadeUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes swarmPulse { from { transform: scale(1); } to { transform: scale(1.08); } }
                @keyframes scanLine { 0% { transform: translateX(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateX(100%); opacity: 0; } }
                @keyframes progress { 0% { width: 0%; } 50% { width: 85%; } 70% { width: 90%; } 100% { width: 95%; } }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                @media (max-width: 768px) { 
                    #pro-dashboard-page .card-grid { grid-template-columns: 1fr !important; } 
                    #pro-dashboard-page .command-deck { padding: 32px 16px !important; }
                    #pro-dashboard-page .sentiment-sticky-bar { 
                        padding: 16px !important; 
                        flex-direction: column !important; 
                        gap: 16px !important; 
                        text-align: center;
                        margin-bottom: 24px !important;
                        top: calc(var(--banner-height, 0px) + 74px) !important; 
                    }
                    #pro-dashboard-page .sentiment-sticky-bar .btn { width: 100% !important; }
                    #pro-dashboard-page .sentiment-sticky-bar div { font-size: 14px !important; line-height: 1.4; }
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

function StockResultCard({ stock, onSelect, highlight = false, selected, onToggleSelect }) {
    const isUp = stock.upside > 0;
    return (
        <div className="glass-card stock-card-interactive" style={{
            cursor: 'pointer', padding: 20, position: 'relative', overflow: 'hidden',
            border: selected ? '2px solid var(--primary)' : highlight ? `1px solid ${isUp ? 'var(--emerald)' : 'var(--crimson)'}` : undefined,
            background: selected ? 'rgba(14, 165, 233, 0.1)' : undefined
        }}>
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                <input
                    type="checkbox"
                    checked={selected || false}
                    onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
            </div>
            <div onClick={onSelect}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace' }}>{stock.ticker}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Score: {stock.score}/10</div>
                    </div>
                    <div style={{ textAlign: 'right', paddingRight: 20 }}>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>${stock.price}</div>
                        <div style={{ color: isUp ? 'var(--emerald)' : 'var(--crimson)', fontWeight: 700 }}>
                            {isUp ? '+' : ''}{stock.upside}%
                        </div>
                    </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>AI Target:</span>
                    <span style={{ color: 'var(--sky)', fontWeight: 700 }}>${stock.predicted}</span>
                </div>
            </div>
        </div>
    );
}
