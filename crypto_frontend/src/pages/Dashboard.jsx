import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, BarChart3, Clock, Zap, Target, BrainCircuit, Shield, Sparkles, Activity, AlertTriangle, ChevronRight, TrendingDown, Gem, Star, Rocket, Flame, Fingerprint, Info } from 'lucide-react';
import axios from 'axios';
import { NinjaAI, NinjaLogic, NinjaTarget } from '../components/NinjaIllustrations';
import KageLogo from '../components/KageLogo';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('gainers'); // 'gainers', 'losers', 'penny_gems', 'new_listings'
    const [logs, setLogs] = useState([
        "SYSTEM_INITIALIZED",
        "SYNCING_MARKET_DATA...",
        "ENCRYPTED_LINK_ACTIVE",
        "MAPPING_OPPORTUNITIES...",
    ]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/crypto/stats`);
                setData(response.data);
                const activeCount = response.data.global.active_cryptos;
                setLogs(prev => [...prev, `MARKET_SCAN :: ${activeCount} ASSETS ANALYZED`, ">> TREND_DETECTED :: CALCULATING_ENTRIES"]);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching crypto stats:', error);
                setLogs(prev => [...prev, "!! SIGNAL_LOST :: DATA_DISCONNECTED", "!! RECONNECTING..."]);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 60000); // 60s sync (aligned with backend cache)
        return () => clearInterval(interval);
    }, []);

    const renderStat = (label, value, icon, color) => (
        <div className="glass-card" style={{ padding: "20px 24px", borderLeft: `4px solid ${color}`, position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.5px" }}>{label}</span>
                {icon}
            </div>
            <div style={{ fontSize: 28, fontWeight: 950, fontFamily: "var(--font-mono)", color: "white", letterSpacing: "-1px" }}>{value}</div>
        </div>
    );

    const renderSignalBadge = (signal) => {
        const config = {
            "VOLUME_BREAKOUT": { color: "var(--amber)", icon: <Fingerprint size={10} />, label: "BREAKOUT" },
            "OVERSOLD_ZONE": { color: "var(--crimson)", icon: <Target size={10} />, label: "DIP_BUY" },
            "MOON_MOMENTUM": { color: "var(--emerald)", icon: <Rocket size={10} />, label: "PUMPING" },
            "NEW_LISTING": { color: "var(--primary)", icon: <Star size={10} />, label: "NEW" },
            "SMALL_CAP_HEAT": { color: "orange", icon: <Flame size={10} />, label: "HEAT" }
        };
        const s = config[signal] || { color: "rgba(255,255,255,0.4)", icon: null, label: signal };
        return (
            <div key={signal} style={{ 
                padding: "2px 8px", 
                borderRadius: 4, 
                background: `${s.color}15`, 
                border: `1px solid ${s.color}30`,
                color: s.color,
                fontSize: 8,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                gap: 4
            }}>
                {s.icon} {s.label}
            </div>
        );
    };

    const activeCategory = data?.data[activeTab] || { list: [], insight: { advice: "Scanning...", confidence: 0 } };
    const activeList = activeCategory.list;
    const activeInsight = activeCategory.insight;

    return (
        <div style={{ background: "#050508", minHeight: "100vh", color: "white", display: "flex", flexDirection: "column" }}>
            {/* Command Header */}
            <header style={{ 
                padding: "20px 48px", 
                borderBottom: "1px solid rgba(14,165,233,0.1)", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                background: "rgba(5,5,8,0.9)",
                backdropFilter: "blur(20px)",
                zIndex: 100,
                position: "sticky",
                top: 0
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <KageLogo width={32} height={32} />
                    <span style={{ fontSize: 24, fontWeight: 950, letterSpacing: "-1.5px" }}>KAGE <span style={{ color: "var(--primary)" }}>AI</span></span>
                    <div style={{ height: 16, width: 1, background: "rgba(255,255,255,0.1)", margin: "0 8px" }} />
                    <div style={{ fontFamily: "var(--font-mono)", color: "var(--emerald)", fontSize: 10, display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
                        <span className="pulse-dot"></span> LIVE NODES ACTIVE
                    </div>
                </div>

                <div className="glass" style={{ width: 400, height: 36, padding: "0 16px", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--primary)", overflow: "hidden", display: "flex", alignItems: "center", gap: 16, borderRadius: 8, border: "1px solid rgba(14,165,233,0.1)" }}>
                     <Activity size={12} />
                     <div style={{ display: "flex", gap: 12 }}>
                        {logs.slice(-3).map((log, i) => (
                            <div key={i} style={{ opacity: (i + 1) / 3, whiteSpace: "nowrap" }}>{log}</div>
                        ))}
                     </div>
                </div>
            </header>

            <main style={{ flex: 1, padding: "40px 48px", maxWidth: 1800, margin: "0 auto", width: "100%" }}>
                {/* Global Metrics Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginBottom: 40 }}>
                    {renderStat("MARKET CAP", data?.global.market_cap || "...", <TrendingUp size={14} color="var(--primary)" />, "var(--primary)")}
                    {renderStat("BTC DOMINANCE", data?.global.bitcoin_dominance || "...", <Target size={14} color="var(--crimson)" />, "var(--crimson)")}
                    {renderStat("GLOBAL VOLUME", data?.global.volume_24h || "...", <Zap size={14} color="var(--amber)" />, "var(--amber)")}
                    {renderStat("ACTIVE ASSETS", data?.global.active_cryptos || "...", <Shield size={14} color="var(--emerald)" />, "var(--emerald)")}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
                    {/* Primary Intelligence Grid */}
                    <div className="glass" style={{ borderRadius: 24, padding: "40px", position: "relative", minHeight: 700 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4, letterSpacing: "-0.5px" }}>MARKET OPPORTUNITIES</h2>
                                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Intelligent scanning across 250+ real-time profit nodes.</p>
                            </div>
                            
                            {/* Tab Switcher */}
                            <div className="glass" style={{ display: "flex", padding: 4, borderRadius: 12, border: "1px solid rgba(14,165,233,0.1)" }}>
                                {[
                                    { id: 'gainers', label: 'TOP GAINERS', icon: <TrendingUp size={12} /> },
                                    { id: 'losers', label: 'TOP LOSERS', icon: <TrendingDown size={12} /> },
                                    { id: 'penny_gems', label: 'PENNY GEMS', icon: <Gem size={12} /> },
                                    { id: 'new_listings', label: 'NEW LISTINGS', icon: <Star size={12} /> }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            padding: "8px 16px",
                                            borderRadius: 10,
                                            border: "none",
                                            background: activeTab === tab.id ? "var(--primary)" : "transparent",
                                            color: activeTab === tab.id ? "white" : "var(--text-muted)",
                                            fontSize: 10,
                                            fontWeight: 900,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ animation: "float 3s infinite" }}><NinjaAI width={80} height={80} /></div>
                                    <div style={{ marginTop: 24, fontSize: 12, color: "var(--primary)", fontWeight: 900, letterSpacing: "4px" }}>INITIALIZING_MARKET_LINK...</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                                <AnimatePresence mode="wait">
                                    {activeList.map((coin, i) => (
                                        <motion.div 
                                            key={`${activeTab}-${coin.id || coin.symbol}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: i * 0.03, duration: 0.2 }}
                                            className="glass"
                                            style={{ 
                                                padding: "16px 20px", 
                                                borderRadius: 20, 
                                                display: "flex", 
                                                justifyContent: "space-between", 
                                                alignItems: "center", 
                                                border: "1px solid rgba(255,255,255,0.03)",
                                                background: "rgba(255,255,255,0.01)"
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                                                    {coin.image ? <img src={coin.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontWeight: 900, color: "var(--primary)" }}>{coin.symbol[0]}</span>}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: "white", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                                                        {coin.name}
                                                        <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 900 }}>#{coin.rank || '??'}</span>
                                                    </div>
                                                    <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                                        {coin.signals?.map(s => renderSignalBadge(s))}
                                                        {!coin.signals?.length && <div style={{ fontSize: 8, color: "rgba(255,255,255,0.05)", fontWeight: 900 }}>STEADY_ACTION</div>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontWeight: 900, fontFamily: "var(--font-mono)", fontSize: 16, color: "white" }}>{coin.formatted_price}</div>
                                                <div style={{ fontSize: 12, fontWeight: 900, color: coin.change > 0 || coin.formatted_change.includes('+') ? "var(--emerald)" : "var(--crimson)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                                                    {coin.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                    {coin.formatted_change}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                        
                        {/* Empty States */}
                        {!loading && activeList.length === 0 && (
                            <div style={{ padding: 100, textAlign: "center" }}>
                                <div style={{ animation: "pulse 2s infinite", opacity: 0.3 }}><NinjaTarget width={60} height={60} style={{ margin: "0 auto" }} /></div>
                                <div style={{ fontWeight: 900, fontSize: 11, letterSpacing: "2px", marginTop: 20, color: "var(--text-muted)" }}>NO_RELEVANT_TARGETS_FOUND</div>
                            </div>
                        )}
                    </div>

                    {/* Right Humanized Sidebar */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                        {/* Market Intelligence */}
                        <div className="glass" style={{ borderRadius: 24, padding: "32px", border: "1px solid rgba(14,165,233,0.15)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--primary)15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <BrainCircuit size={20} color="var(--primary)" />
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "1px" }}>TRADE SUMMARY</div>
                            </div>
                            
                            <div style={{ background: "rgba(0,0,0,0.3)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                                <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)", fontWeight: 500 }}>
                                    {activeInsight.advice}
                                </p>
                            </div>
                            
                            <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 9, fontWeight: 900, color: "var(--text-muted)" }}>SIGNAL CONFIDENCE</span>
                                <span style={{ fontSize: 11, fontWeight: 900, color: activeInsight.confidence > 80 ? "var(--emerald)" : "var(--amber)" }}>{activeInsight.confidence}%</span>
                            </div>
                            <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 8 }}>
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${activeInsight.confidence}%` }}
                                    style={{ height: "100%", background: activeInsight.confidence > 80 ? "var(--emerald)" : "var(--amber)", borderRadius: 2 }} 
                                />
                            </div>
                        </div>

                        {/* Market Fundamentals */}
                        <div className="glass" style={{ borderRadius: 24, padding: 32 }}>
                            <h3 style={{ fontSize: 12, fontWeight: 900, marginBottom: 20, color: "var(--text-muted)", letterSpacing: "1px" }}>MARKET STATUS</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {[
                                    { k: "MONITORING", v: "250+ ASSETS", c: "var(--primary)" },
                                    { k: "DATA_LINK", v: "LIVE / SYNCED", c: "var(--emerald)" },
                                    { k: "REFRESH", v: "REAL-TIME", c: "white" },
                                    { k: "ACCURACY", v: "99.9%", c: "white" }
                                ].map(item => (
                                    <div key={item.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: 9, fontWeight: 950, color: "var(--text-muted)" }}>{item.k}</span>
                                        <span style={{ fontSize: 10, fontWeight: 900, color: item.c, fontFamily: "var(--font-mono)" }}>{item.v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Opportunity Alert History */}
                        <div style={{ border: "1px solid rgba(14,165,233,0.05)", borderRadius: 20, padding: 20, background: "rgba(0,0,0,0.3)" }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-muted)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                <Info size={12} /> RECENT LOGS
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {logs.slice(-6).reverse().map((log, i) => (
                                    <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: i === 0 ? "var(--primary)" : "rgba(14,165,233,0.3)" }}>
                                        {`[${new Date().toLocaleTimeString()}] ${log}`}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Humanized Footer Ticker */}
            <div style={{ 
                background: "rgba(14,165,233,0.05)", 
                borderTop: "1px solid rgba(14,165,233,0.1)", 
                padding: "8px 48px", 
                fontSize: 10,
                fontWeight: 900,
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                overflow: "hidden"
            }}>
                <div style={{ display: "flex", gap: 60, animation: "scrollText 45s linear infinite" }}>
                    {[1, 2, 3].map(j => (
                        <React.Fragment key={j}>
                            <span style={{ color: "var(--primary)" }}>SCANNIG FOR HIGH-LIQUIDITY BREAKOUTS</span>
                            <span>MONITORING LOW-CAP VOLATILITY ANOMALIES</span>
                            <span style={{ color: "var(--crimson)" }}>DIP-BUY SIGNALS DETECTED IN TOP 200 SECTOR</span>
                            <span>LIVE MARKET SYNC ACTIVE :: NO LAG DETECTED</span>
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes scrollText {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .pulse-dot {
                    height: 6px;
                    width: 6px;
                    background-color: var(--emerald);
                    border-radius: 50%;
                    display: inline-block;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
