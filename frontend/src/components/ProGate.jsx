
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Lock, Zap, Crown, Check, Star, Rocket } from 'lucide-react';
import api from '../lib/api';
import { useState } from 'react';
import { NinjaEliteUpgrade } from './NinjaIllustrations';
import CommandCenterConstruction from './CommandCenterConstruction';

export default function ProGate({ children }) {
    const { isPro, user, checkProStatus, hasUsedTrial } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showConstruction, setShowConstruction] = useState(false);
    const [bypassGate, setBypassGate] = useState(false);

    if (showConstruction) {
        return (
            <CommandCenterConstruction
                onComplete={async (profileData) => {
                    // Save profile data if provided
                    if (profileData) {
                        try {
                            await api.patch('/auth/profile', {
                                user_profile: profileData,
                            });
                        } catch (e) {
                            console.warn('Failed to save profile data:', e);
                        }
                    }
                    setShowConstruction(false);
                    window.location.reload();
                }}
            />
        );
    }

    if (isPro || bypassGate) return children;

    async function handleSubscribe() {
        setLoading(true);
        try {
            const res = await api.post('/payments/create-order');
            const { orderId, amount, keyId, currency } = res.data.data;

            const loadScript = (src) => {
                return new Promise((resolve) => {
                    const script = document.createElement('script');
                    script.src = src;
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    document.body.appendChild(script);
                });
            };

            const rzpLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
            if (!rzpLoaded) {
                alert('Razorpay SDK failed to load. Are you online?');
                setLoading(false);
                return;
            }

            const options = {
                key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: amount,
                currency: currency,
                name: 'KAGE AI',
                description: 'Lifetime Early Bird Access',
                order_id: orderId,
                handler: async function (response) {
                    try {
                        await api.post('/payments/verify', {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        await checkProStatus();
                        // Show the Command Center Construction animation!
                        setShowConstruction(true);
                    } catch (err) {
                        console.error('Payment verification failed:', err);
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                prefill: { email: user?.email || '' },
                theme: { color: '#0ea5e9' },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert(`Payment Failed: ${response.error.description}`);
            });
            rzp.open();
        } catch (err) {
            console.error("ProGate Subscription Error:", err);
            const msg = err.response?.data?.detail || err.message || "Unknown error";
            alert(`Failed to initiate payment. Server says: ${msg}`);
        }
        setLoading(false);
    }

    return (
        <div className="page" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '85vh', position: 'relative', overflow: 'hidden'
        }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div className="glass-card" style={{
                maxWidth: 900, width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid var(--ninja-border)'
            }}>
                {/* Left Side */}
                <div style={{
                    padding: 48, background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(15, 23, 42, 0.4) 100%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center',
                    borderRight: '1px solid var(--ninja-border)'
                }}>
                    <div style={{ marginBottom: 32 }}>
                        <NinjaEliteUpgrade width={280} height={280} />
                    </div>
                    <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Early Bird Access</h2>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 320 }}>
                        Join the elite circle of early adopters. Lifetime access to institutional-grade AI.
                    </p>
                </div>

                {/* Right Side */}
                <div style={{ padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{
                            padding: '6px 12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
                            borderRadius: 100, display: 'flex', alignItems: 'center', gap: 6
                        }}>
                            <Crown size={14} color="var(--amber)" fill="var(--amber)" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.05em' }}>LIMITED SEATS</span>
                        </div>
                    </div>

                    <h3 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>
                        Unlock <span className="text-gradient">Lifetime Intelligence</span>
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                        {['Real-time AI Predictions', 'Unlimited Scans', 'Penny Stock Breakouts', 'Early Bird Badge on Profile', 'Private Discord Access'].map((feature, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Check size={12} color="white" strokeWidth={3} />
                                </div>
                                <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 }}>{feature}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 48, fontWeight: 900, color: 'white' }}>₹999</span>
                            <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>one-time</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Limited time offer. Normal price ₹999/mo.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button className="btn btn-primary btn-lg" onClick={handleSubscribe} disabled={loading} style={{ width: '100%', height: 56, fontSize: 16, display: 'flex', justifyContent: 'center', gap: 10 }}>
                            {loading ? 'Processing...' : <><Zap size={20} fill="currentColor" /> Claim Early Bird Status</>}
                        </button>

                        {!hasUsedTrial && (
                            <button
                                className="btn btn-secondary"
                                onClick={() => setBypassGate(true)}
                                style={{ width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.8 }}
                            >
                                <Rocket size={16} /> Start One-Time Free Scan
                            </button>
                        )}
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Lock size={12} /> Secure 256-bit encryption •
                        <Link to="/privacy" style={{ color: 'inherit' }}>Privacy</Link> •
                        <Link to="/terms" style={{ color: 'inherit' }}>Terms</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
