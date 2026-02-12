

import { useEffect, useState } from 'react';
import api from '../lib/api';
import StockCard from '../components/StockCard';
import {
    TrendingUp, TrendingDown, Activity, BarChart3, RefreshCw, Clock, Search, AlertTriangle, Check, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import SmartLoader from '../components/SmartLoader';
import { NinjaCharting, NinjaMeditating, NinjaVictory, NinjaDojo } from '../components/NinjaIllustrations';
import StockDetailModal from '../components/StockDetailModal';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function MarketOverview() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tickerSearch, setTickerSearch] = useState('');
    const [tickerResult, setTickerResult] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [selectedTicker, setSelectedTicker] = useState(null);

    useEffect(() => {
        fetchOverview();
    }, []);

    async function fetchOverview() {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/market/overview');
            setData(res.data.data);
        } catch (err) {
            setError('Failed to fetch market data. Is the API server running?');
        }
        setLoading(false);
    }

    async function analyzeTicker() {
        if (!tickerSearch.trim()) return;
        setAnalyzing(true);
        setTickerResult(null);
        try {
            const res = await api.get(`/market/analyze/${tickerSearch.trim().toUpperCase()}`);
            setTickerResult(res.data.data);
        } catch {
            setTickerResult({ error: true });
        }
        setAnalyzing(false);
    }

    if (loading) {
        return (
            <div className="page" style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80
            }}>
                <SmartLoader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="page" style={{ padding: '120px 0' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 24, opacity: 0.5 }}>
                        <NinjaDojo width={150} height={150} />
                    </div>
                    <h2 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <AlertTriangle size={32} color="var(--amber)" /> Connection Error
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
                    <button className="btn btn-primary" onClick={fetchOverview}>
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page" style={{ paddingBottom: 80 }}>
            {/* Ambient Background */}
            <div style={{ position: 'fixed', top: '10%', right: '-15%', opacity: 0.03, pointerEvents: 'none', zIndex: 0 }}>
                <NinjaCharting width={600} height={600} />
            </div>

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 32,
                    paddingTop: 24,
                    flexWrap: 'wrap',
                    gap: 16,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{
                            width: 80, height: 80,
                            background: 'var(--gradient-card)',
                            borderRadius: '24px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid var(--ninja-border)',
                            boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ animation: 'spin 20s linear infinite', opacity: 0.8 }}>
                                <NinjaCharting width={60} height={60} />
                            </div>
                        </div>
                        <div>
                            <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.02em' }}>
                                Market <span className="text-gradient">Overview</span>
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
                                Live tracking of US Indices & Top Market Movers
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {!user && (
                            <Link to="/" className="btn btn-secondary" style={{ marginRight: 8 }}>
                                <ExternalLink size={16} /> Home
                            </Link>
                        )}
                        <span className={`badge ${data?.marketOpen ? 'badge-green' : 'badge-red'} shine-effect`} style={{ height: 36, padding: '0 16px', fontSize: 14 }}>
                            <Activity size={16} />
                            {data?.marketOpen ? 'Market Open' : 'Market Closed'}
                        </span>
                        <button className="btn btn-ghost" onClick={fetchOverview} title="Refresh Data">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {/* Index Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 20,
                    marginBottom: 48,
                }}>
                    {data?.indices?.map((idx, i) => (
                        <div key={i} className="glass-card animate-in-up"
                            style={{
                                animationDelay: `${i * 0.1}s`,
                                padding: 24,
                                borderTop: idx.changePct >= 0 ? '3px solid var(--emerald)' : '3px solid var(--crimson)'
                            }}>
                            <div className="label" style={{ fontSize: 14, marginBottom: 8, opacity: 0.7 }}>{idx.name}</div>
                            <div className="value" style={{ fontSize: 28, fontWeight: 800 }}>
                                {idx.price?.toLocaleString()}
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 12,
                                color: idx.changePct >= 0 ? 'var(--emerald-glow)' : 'var(--crimson-glow)',
                                fontWeight: 700,
                                fontSize: 15,
                            }}>
                                {idx.changePct >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                {idx.changePct >= 0 ? '+' : ''}{idx.changePct}%
                                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13, marginLeft: 4 }}>
                                    ({idx.change >= 0 ? '+' : ''}{idx.change})
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Ticker Search Analysis */}
                <div className="glass-card" style={{ marginBottom: 48, padding: 0, overflow: 'hidden', border: '1px solid var(--ninja-border)' }}>
                    <div style={{ borderBottom: '1px solid var(--ninja-border)', padding: 24, background: 'rgba(255,255,255,0.02)' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                            <Search size={18} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary)' }} />
                            Instant Technical Analysis
                        </h3>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <input
                                type="text"
                                value={tickerSearch}
                                onChange={e => setTickerSearch(e.target.value.toUpperCase())}
                                onKeyDown={e => e.key === 'Enter' && analyzeTicker()}
                                placeholder="Enter Symbol (e.g. AAPL, NVDA, TSLA)..."
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    background: 'var(--ninja-surface)',
                                    border: '1px solid var(--ninja-border)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 16,
                                    outline: 'none',
                                    transition: 'border 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={e => e.target.style.borderColor = 'var(--ninja-border)'}
                            />
                            <button className="btn btn-primary" onClick={analyzeTicker} disabled={analyzing} style={{ minWidth: 120 }}>
                                {analyzing ? 'Scanning...' : 'Analyze'}
                            </button>
                        </div>
                    </div>

                    {tickerResult && !tickerResult.error && (
                        <div style={{ padding: 32, animation: 'fadeIn 0.5s ease' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'start' }}>
                                {/* Left: Metrics */}
                                <div style={{ flex: 1, minWidth: 250 }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
                                        <h2 style={{ fontSize: 32, fontWeight: 900 }}>{tickerResult.ticker}</h2>
                                        <span style={{ fontSize: 24, fontFamily: 'var(--font-mono)' }}>${tickerResult.price}</span>
                                        <span style={{
                                            fontSize: 18, fontWeight: 600,
                                            color: tickerResult.changePct >= 0 ? 'var(--emerald)' : 'var(--crimson)'
                                        }}>
                                            {tickerResult.changePct >= 0 ? '+' : ''}{tickerResult.changePct}%
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                        <div className="metric-box">
                                            <div className="label">RSI (14)</div>
                                            <div className="val">{tickerResult.rsi}</div>
                                        </div>
                                        <div className="metric-box">
                                            <div className="label">AI Score</div>
                                            <div className="val">{tickerResult.score}/4</div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 24 }}>
                                        <div className={`verdict-badge ${tickerResult.verdict.replace(' ', '-').toLowerCase()}`}>
                                            {tickerResult.verdict}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {tickerResult.signals?.map((sig, i) => (
                                            <span key={i} className="badge badge-green" style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20 }}>
                                                <Check size={12} /> {sig}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Right: Chart & Mascot */}
                                <div style={{ flex: 1.5, minWidth: 300, position: 'relative' }}>
                                    {/* Mascot Reaction */}
                                    <div style={{ position: 'absolute', top: -20, right: 0, zIndex: 10, animation: 'popIn 0.5s cubic-bezier(0.19, 1, 0.22, 1)' }}>
                                        {tickerResult.verdict === 'STRONG BUY' ? (
                                            <NinjaVictory width={120} height={120} />
                                        ) : (
                                            <NinjaMeditating width={100} height={100} />
                                        )}
                                    </div>

                                    <div style={{ height: 250, background: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 16, border: '1px solid var(--ninja-border)' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={tickerResult.priceHistory}>
                                                <defs>
                                                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={tickerResult.changePct >= 0 ? "var(--emerald)" : "var(--crimson)"} stopOpacity={0.3} />
                                                        <stop offset="100%" stopColor={tickerResult.changePct >= 0 ? "var(--emerald)" : "var(--crimson)"} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <Tooltip
                                                    contentStyle={{
                                                        background: 'var(--ninja-surface)',
                                                        border: '1px solid var(--ninja-border)',
                                                        borderRadius: 8,
                                                        color: 'var(--text-primary)',
                                                        fontSize: 13,
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="close"
                                                    stroke={tickerResult.changePct >= 0 ? "var(--emerald)" : "var(--crimson)"}
                                                    fill="url(#chartFill)"
                                                    strokeWidth={2}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                                        <a
                                            href={`https://finance.yahoo.com/quote/${tickerResult.ticker}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                        >
                                            View on Yahoo Finance <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tickerResult?.error && (
                        <div style={{ padding: 40, textAlign: 'center' }}>
                            <p style={{ color: 'var(--crimson-glow)', fontSize: 16 }}>
                                🚫 No data found for "{tickerSearch}". Please check the symbol.
                            </p>
                        </div>
                    )}
                </div>

                {/* Top Movers */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--ninja-border)',
                        background: 'rgba(255,255,255,0.01)'
                    }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                            <TrendingUp size={18} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary)' }} />
                            Today's Top Movers
                        </h3>
                    </div>
                    <div style={{ padding: '20px' }}>
                        {data?.topMovers?.map((stock, i) => (
                            <div key={i} style={{
                                position: 'relative',
                                paddingLeft: i < 3 ? 32 : 0,
                                marginBottom: 12
                            }}>
                                {i < 3 && (
                                    <div style={{
                                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: i === 0 ? 'var(--amber)' : 'var(--ninja-border)',
                                        color: i === 0 ? 'black' : 'var(--text-secondary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 700
                                    }}>
                                        {i + 1}
                                    </div>
                                )}
                                <StockCard
                                    stock={stock}
                                    compact
                                    onClick={() => setSelectedTicker(stock.ticker)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {selectedTicker && (
                <StockDetailModal
                    ticker={selectedTicker}
                    onClose={() => setSelectedTicker(null)}
                />
            )}

            <style>{`
                .metric-box { background: rgba(0,0,0,0.2); padding: 12px; borderRadius: 8px; border: 1px solid var(--ninja-border); }
                .metric-box .label { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; }
                .metric-box .val { font-size: 18px; font-weight: 700; font-family: var(--font-mono); }
                
                .verdict-badge { 
                    display: inline-block; padding: 12px 24px; border-radius: 8px; 
                    font-size: 18px; font-weight: 900; letter-spacing: 1px;
                }
                .verdict-badge.strong-buy { background: rgba(16, 185, 129, 0.2); color: var(--emerald-glow); border: 1px solid var(--emerald); }
                .verdict-badge.watchlist { background: rgba(245, 158, 11, 0.1); color: var(--amber); border: 1px solid var(--amber); }
                
                @keyframes popIn {
                    from { transform: scale(0) rotate(-10deg); opacity: 0; }
                    to { transform: scale(1) rotate(0deg); opacity: 1; }
                }

                @media (max-width: 768px) {
                    .container { padding: 0 20px !important; }
                    h1 { font-size: 28px !important; }
                    .glass-card { padding: 16px !important; }
                    /* Stack flex containers */
                    div[style*="display: flex"] {
                        flex-wrap: wrap !important;
                    }
                }
            `}</style>
        </div>
    );
}
