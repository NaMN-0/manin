
import { useEffect, useState, useMemo, memo } from 'react';
import {
    X, ExternalLink, TrendingUp, TrendingDown, Activity,
    BarChart3, DollarSign, Globe, Layers, AlertTriangle, Shield, Zap
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import NinjaLoader from './NinjaLoader';

// Memoize Chart to prevent re-renders on parent updates
const StockChart = memo(({ data }) => (
    <div style={{
        height: 'clamp(200px, 40vw, 300px)',
        marginBottom: 32,
        background: 'var(--ninja-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        border: '1px solid var(--ninja-border)'
    }}>
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip
                    contentStyle={{
                        background: 'var(--ninja-surface)',
                        border: '1px solid var(--ninja-border)',
                        borderRadius: 8,
                        color: 'var(--text-primary)',
                    }}
                />
                <Area type="monotone" dataKey="close" stroke="var(--primary)" fill="url(#chartFill)" strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
        </ResponsiveContainer>
    </div>
));

function StockDetailModal({ ticker, initialData, onClose }) {
    const [data, setData] = useState(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!ticker) return;

        // If we have initial data matching the ticker, use it and don't fetch
        if (initialData && initialData.ticker === ticker) {
            setData(initialData);
            setLoading(false);
            return;
        }

        let mounted = true;
        setLoading(true);

        async function fetchData() {
            try {
                // Use cached data if available in api? (API lib might handle it, or we implement here)
                const res = await api.get(`/api/penny/analyze/${ticker}`);
                if (mounted) setData(res.data.data);
            } catch (err) {
                if (mounted) setError('Failed to load deep analysis.');
            }
            if (mounted) setLoading(false);
        }

        fetchData();

        return () => { mounted = false; };
    }, [ticker, initialData]);

    if (!ticker) return null;

    // Use memoized value for expensive derives
    const isUp = data?.upside > 0;

    // Memoize the chart data to prevent chart re-renders
    const chartData = useMemo(() => data?.priceHistory || [], [data?.priceHistory]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(5, 5, 8, 0.6)', // Reduced opacity/complexity
            backdropFilter: 'blur(4px)', // Reduced blur for performance
            // animation: 'fadeIn 0.2s ease-out' // Removed CSS animation if it causes lag, or keep it simple
        }} onClick={onClose}>
            <div className="glass-card" style={{
                maxWidth: 900,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: 0,
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid var(--ninja-border)',
                background: 'var(--ninja-black)',
                transform: 'translateZ(0)' // Hardware acceleration
            }} onClick={e => e.stopPropagation()}>

                {/* Header - Sticky */}
                <div style={{
                    padding: 'clamp(16px, 3vw, 24px) clamp(20px, 4vw, 32px)',
                    borderBottom: '1px solid var(--ninja-border)',
                    background: 'var(--ninja-black)', // Solid background for sticky header performance
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                }}>
                    <div>
                        <h2 style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-mono)', lineHeight: 1, marginBottom: 4 }}>
                            {ticker}
                        </h2>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                                {data?.companyName || 'US Stock Market'}
                            </span>
                            {data?.sector && (
                                <span className="badge" style={{ background: 'var(--ninja-surface)', border: '1px solid var(--ninja-border)' }}>
                                    {data.sector}
                                </span>
                            )}
                        </div>
                    </div>

                    <button onClick={onClose} className="btn btn-ghost" style={{ padding: 8 }}>
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: 64, display: 'flex', justifyContent: 'center' }}>
                        <NinjaLoader variant="meditating" />
                    </div>
                ) : error ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--crimson)' }}>
                        <AlertTriangle size={48} style={{ marginBottom: 16 }} />
                        <p>{error}</p>
                    </div>
                ) : (
                    <div style={{ padding: 'clamp(16px, 4vw, 32px)' }}>
                        {/* Metrics */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                            <MetricCard label="Current Price" value={`$${data.price}`} />
                            <MetricCard
                                label="AI Target"
                                value={`$${data.predicted}`}
                                subValue={`${data.upside > 0 ? '+' : ''}${data.upside}%`}
                                isUp={isUp}
                                highlight={true}
                            />
                            <MetricCard
                                label="Intel Score"
                                value={`${data.score}/10`}
                                color="var(--sky)"
                            />
                            <MetricCard label="Volume" value={`${(data.volume / 1000000).toFixed(2)}M`} />
                        </div>

                        {/* Chart */}
                        {chartData.length > 0 && <StockChart data={chartData} />}

                        {/* Deep Data Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, marginBottom: 32 }}>
                            {/* Fundamentals */}
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <BarChart3 size={20} color="var(--amber)" /> Fundamentals
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <DataRow label="Market Cap" value={`$${(data.marketCap / 1000000).toFixed(1)}M`} />
                                    <DataRow label="P/E Ratio" value={data.pe > 0 ? data.pe.toFixed(2) : 'N/A'} />
                                    <DataRow label="52W High" value={`$${data.yearHigh}`} />
                                    <DataRow label="52W Low" value={`$${data.yearLow}`} />
                                    <DataRow label="Float" value={data.float ? `${(data.float / 1000000).toFixed(1)}M` : 'N/A'} />
                                    <DataRow label="Sector" value={data.sector} />
                                </div>
                            </div>

                            {/* Signals */}
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Zap size={20} color="var(--primary)" /> AI Signals
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {data.signals && data.signals.length > 0 ? (
                                        data.signals.map((sig, i) => (
                                            <div key={i} style={{
                                                padding: '12px 16px',
                                                background: 'var(--ninja-surface)',
                                                borderRadius: 'var(--radius-md)',
                                                borderLeft: '4px solid var(--primary)',
                                                fontSize: 14,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                {sig}
                                                <Activity size={14} color="var(--text-muted)" />
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No active signals derived.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Links */}
                        <div style={{ borderTop: '1px solid var(--ninja-border)', paddingTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <ExternalLinkBtn href={`https://finance.yahoo.com/quote/${ticker}`} icon={Globe} label="Yahoo" />
                            <ExternalLinkBtn href={`https://www.tradingview.com/symbols/${ticker}/`} icon={Activity} label="TradingView" />
                            <ExternalLinkBtn href={`https://www.google.com/finance/quote/${ticker}:NASDAQ`} icon={DollarSign} label="Google" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Subcomponents for performance & cleanliness
const MetricCard = ({ label, value, subValue, isUp, highlight, color }) => (
    <div className="metric-card" style={highlight ? { borderColor: isUp ? 'var(--emerald)' : 'var(--crimson)' } : {}}>
        <div className="label">{label}</div>
        <div className="value" style={{ color: color || (highlight ? (isUp ? 'var(--emerald-glow)' : 'var(--crimson-glow)') : 'inherit') }}>
            {value}
        </div>
        {subValue && (
            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: isUp ? 'var(--emerald)' : 'var(--crimson)' }}>
                {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {subValue}
            </div>
        )}
    </div>
);

const DataRow = ({ label, value }) => (
    <div style={{ padding: '12px', background: 'var(--ninja-surface)', borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
);

const ExternalLinkBtn = ({ href, icon: Icon, label }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8 }}>
        <Icon size={16} /> {label}
    </a>
);

export default memo(StockDetailModal);
