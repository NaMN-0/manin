import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
    Search, RefreshCw, TrendingUp, TrendingDown, ArrowUpDown,
    Lock, Zap, Filter, ChevronRight, Target, ExternalLink, Crown
} from 'lucide-react';
import NinjaLoader from '../components/NinjaLoader';
import StockDetailModal from '../components/StockDetailModal';
import { NinjaPennyRocket, NinjaMaster, NinjaDojo } from '../components/NinjaIllustrations';

export default function PennyStocks() {
    const { isPro } = useAuth();
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('volume');
    const [sortDir, setSortDir] = useState('desc');
    const [search, setSearch] = useState('');
    const [selectedTicker, setSelectedTicker] = useState(null);

    useEffect(() => {
        fetchStocks();
    }, []);

    async function fetchStocks() {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/penny/basic?limit=100');
            setStocks(res.data.data || []);
        } catch (err) {
            setError('Failed to load penny stocks. Is the API running?');
        }
        setLoading(false);
    }

    function sortedStocks() {
        let filtered = stocks;
        if (search) {
            filtered = filtered.filter(s =>
                s.ticker.toLowerCase().includes(search.toLowerCase())
            );
        }
        return [...filtered].sort((a, b) => {
            const mul = sortDir === 'desc' ? -1 : 1;
            return (a[sortBy] - b[sortBy]) * mul;
        });
    }

    function toggleSort(col) {
        if (sortBy === col) {
            setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(col);
            setSortDir('desc');
        }
    }

    if (loading) {
        return (
            <div className="page" style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 80
            }}>
                <NinjaLoader variant="meditating" />
            </div>
        );
    }

    return (
        <div className="page" style={{ paddingBottom: 80 }}>
            {/* Background Decoration */}
            <div style={{ position: 'fixed', top: -100, right: -100, opacity: 0.05, pointerEvents: 'none', zIndex: 0 }}>
                <NinjaDojo width={600} height={600} />
            </div>

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 32,
                    paddingTop: 24,
                    flexWrap: 'wrap-reverse', // Wrap reverse to keep text on top on mobile if needed, or side-by-side
                    gap: 24,
                }}>
                    <div style={{ flex: 1, minWidth: 300 }}>
                        <h1 style={{ fontSize: 42, fontWeight: 900, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 16,
                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                boxShadow: '0 8px 16px rgba(245, 158, 11, 0.1)'
                            }}>
                                <Target size={28} color="var(--amber)" />
                            </div>
                            Penny Stock <span className="text-gradient">Scanner</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6, maxWidth: 600 }}>
                            Scanning <strong>{stocks.length}</strong> high-volatility assets under $5.
                            Uses <strong>Momemtum v2</strong> algorithm to detect breakouts before they happen.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div className="illustration-float">
                            <NinjaPennyRocket width={140} height={140} />
                        </div>
                    </div>
                </div>

                {/* Controls & Search */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 24,
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <div className="search-bar" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '0 20px',
                        background: 'var(--ninja-surface)',
                        border: '1px solid var(--ninja-border)',
                        borderRadius: 100,
                        transition: 'all 0.2s ease',
                        width: '100%',
                        maxWidth: 400,
                        height: 50,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value.toUpperCase())}
                            placeholder="Filter by ticker symbol..."
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 15,
                                outline: 'none',
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        {!isPro && (
                            <Link to="/pro" className="btn btn-amber shine-effect" style={{ padding: '0 24px' }}>
                                <Crown size={16} /> Unlock Pro
                            </Link>
                        )}
                        <button className="btn btn-secondary" onClick={fetchStocks} title="Refresh Data">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: 64 }}>
                        <NinjaDojo width={120} height={120} style={{ opacity: 0.5, marginBottom: 24 }} />
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>System Offline</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
                        <button className="btn btn-primary" onClick={fetchStocks}>Retry Connection</button>
                    </div>
                ) : (
                    <>
                        {/* Table */}
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--ninja-border)' }}>
                            <div className="table-scroll-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th onClick={() => toggleSort('ticker')} className="sortable-th">
                                                Ticker <ArrowUpDown size={12} />
                                            </th>
                                            <th onClick={() => toggleSort('price')} className="sortable-th">
                                                Price <ArrowUpDown size={12} />
                                            </th>
                                            <th onClick={() => toggleSort('volume')} className="sortable-th">
                                                Volume <ArrowUpDown size={12} />
                                            </th>
                                            <th className="hide-mobile">24h High</th>
                                            <th className="hide-mobile">24h Low</th>
                                            <th className="hide-mobile">Volatility</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedStocks().map((stock, i) => {
                                            const range = stock.high - stock.low;
                                            const rangePct = stock.low > 0 ? (range / stock.low * 100) : 0;
                                            return (
                                                <tr key={stock.ticker || i} style={{
                                                    animation: `fadeInUp 0.3s ease forwards`,
                                                    animationDelay: `${i * 0.03}s`,
                                                    opacity: 0
                                                }}>
                                                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                                        <span
                                                            onClick={() => setSelectedTicker(stock.ticker)}
                                                            className="ticker-link"
                                                            style={{
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                padding: '4px 8px',
                                                                borderRadius: 6,
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {stock.ticker} <ExternalLink size={12} style={{ opacity: 0.5 }} />
                                                        </span>
                                                    </td>
                                                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                                                        ${stock.price?.toFixed(4)}
                                                    </td>
                                                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                                                        <span style={{
                                                            color: stock.volume > 1000000 ? 'var(--emerald)' : 'inherit',
                                                            fontWeight: stock.volume > 1000000 ? 700 : 400
                                                        }}>
                                                            {(stock.volume / 1000000).toFixed(2)}M
                                                        </span>
                                                    </td>
                                                    <td className="hide-mobile" style={{ fontFamily: 'var(--font-mono)', color: 'var(--emerald)' }}>
                                                        ${stock.high?.toFixed(4)}
                                                    </td>
                                                    <td className="hide-mobile" style={{ fontFamily: 'var(--font-mono)', color: 'var(--crimson)' }}>
                                                        ${stock.low?.toFixed(4)}
                                                    </td>
                                                    <td className="hide-mobile">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div style={{
                                                                flex: 1,
                                                                height: 6,
                                                                background: 'var(--ninja-surface)',
                                                                borderRadius: 3,
                                                                overflow: 'hidden',
                                                                maxWidth: 100
                                                            }}>
                                                                <div style={{
                                                                    width: `${Math.min(rangePct * 5, 100)}%`,
                                                                    height: '100%',
                                                                    background: `linear-gradient(90deg, var(--primary) 0%, ${rangePct > 10 ? 'var(--crimson)' : 'var(--primary)'} 100%)`,
                                                                    borderRadius: 3,
                                                                }} />
                                                            </div>
                                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 32 }}>
                                                                {rangePct.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pro Upsell - Now with Illustration */}
                        {!isPro && (
                            <div className="glass-card" style={{
                                marginTop: 40,
                                padding: 0,
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                overflow: 'hidden',
                                border: '1px solid var(--primary)',
                                boxShadow: '0 0 40px rgba(14, 165, 233, 0.15)'
                            }}>
                                <div style={{ padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <div style={{ padding: '6px 12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 100, color: 'var(--amber)', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                                            PRO FEATURE
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
                                        See Tomorrow's <span className="text-gradient">Breakouts</span> Today
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6, marginBottom: 24, maxWidth: 500 }}>
                                        Our Pro Scanner uses AI to detect volume spikes before they hit the news.
                                        Get real-time alerts, confidence scores, and unlimited scans.
                                    </p>
                                    <div>
                                        <Link to="/pro" className="btn btn-primary btn-lg shine-effect">
                                            <Zap size={18} /> Unlock Pro Scanner — Start Now
                                        </Link>
                                    </div>
                                </div>
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative'
                                }}>
                                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.2) 0%, transparent 70%)' }}></div>
                                    <NinjaMaster width={220} height={220} style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }} />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedTicker && (
                <StockDetailModal
                    ticker={selectedTicker}
                    onClose={() => setSelectedTicker(null)}
                />
            )}

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .sortable-th { cursor: pointer; transition: color 0.2s; }
                .sortable-th:hover { color: var(--primary); }
                
                .ticker-link:hover { background: rgba(14, 165, 233, 0.1); color: var(--primary); }
                
                .illustration-float { animation: float 6s ease-in-out infinite; }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
                
                @media (max-width: 768px) {
                    .glass-card { grid-template-columns: 1fr !important; }
                    .illustration-float svg { width: 80px !important; height: 80px !important; }
                    h1 { flex-wrap: wrap !important; font-size: 28px !important; }
                }
            `}</style>
        </div>
    );
}
