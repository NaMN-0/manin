
import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api/admin';
import { Terminal, Users, TrendingUp, Clock, RefreshCw, ShieldAlert } from 'lucide-react';

export default function AdminDashboard() {
    const [logs, setLogs] = useState('');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const logEndRef = useRef(null);

    const fetchData = async () => {
        setRefreshing(true);
        try {
            const [logsRes, statsRes] = await Promise.all([
                adminApi.getLogs(200),
                adminApi.getStats()
            ]);

            if (logsRes.status === 'ok') setLogs(logsRes.data);
            if (statsRes.status === 'ok') setStats(statsRes.data);
        } catch (err) {
            console.error("Admin fetch error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="page admin-page">
            <div className="container">
                <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>Command <span className="text-gradient">Center</span></h1>
                        <p style={{ color: 'var(--text-muted)' }}>System Monitoring & User Analytics</p>
                    </div>
                    <button
                        className={`btn btn-secondary ${refreshing ? 'loading' : ''}`}
                        onClick={fetchData}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Syncing...' : 'Sync Now'}
                    </button>
                </header>

                {/* Stats Grid */}
                <div className="stats-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 20,
                    marginBottom: 32
                }}>
                    <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700 }}>TOTAL NINJAS</p>
                                <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>{stats?.totalUsers || 0}</h2>
                            </div>
                            <Users size={24} color="var(--primary)" opacity={0.5} />
                        </div>
                    </div>
                    <div className="glass-card metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700 }}>FOUNDERS CLUB</p>
                                <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>{stats?.proUsers || 0}</h2>
                            </div>
                            <TrendingUp size={24} color="#f59e0b" opacity={0.5} />
                        </div>
                    </div>
                    <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--emerald)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700 }}>NEW RECRUITS (24H)</p>
                                <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>{stats?.recentUsers24h || 0}</h2>
                            </div>
                            <Clock size={24} color="var(--emerald)" opacity={0.5} />
                        </div>
                    </div>
                </div>

                {/* Live Logs Section */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--ninja-border)' }}>
                    <div style={{
                        padding: '16px 24px',
                        background: 'rgba(255,255,255,0.03)',
                        borderBottom: '1px solid var(--ninja-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <Terminal size={18} color="var(--primary)" />
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Production Intelligence Feed</h3>
                    </div>

                    <div style={{
                        height: 500,
                        overflowY: 'auto',
                        background: '#020617',
                        padding: 20,
                        fontFamily: 'monospace',
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: '#cbd5e1'
                    }}>
                        {logs.split('\n').map((line, i) => {
                            const isError = line.includes('[ERROR]') || line.includes('error');
                            const isWarn = line.includes('[WARNING]') || line.includes('warning');

                            return (
                                <div key={i} style={{
                                    color: isError ? '#f87171' : isWarn ? '#fbbf24' : 'inherit',
                                    borderLeft: isError ? '2px solid #ef4444' : isWarn ? '2px solid #f59e0b' : 'none',
                                    paddingLeft: isError || isWarn ? 8 : 0,
                                    marginBottom: 2
                                }}>
                                    {line}
                                </div>
                            );
                        })}
                        <div ref={logEndRef} />
                    </div>
                </div>

                {/* Maintenance Controls */}
                <div style={{ marginTop: 40, padding: 24, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 16, border: '1px dashed rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <ShieldAlert color="#ef4444" size={20} />
                        <h4 style={{ margin: 0, color: '#ef4444', fontWeight: 700 }}>Security Protocol</h4>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        Only access this dashboard from secure networks. All admin actions are logged to the audit trail.
                    </p>
                </div>
            </div>
        </div>
    );
}
