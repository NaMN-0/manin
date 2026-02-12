import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import TraderNinjaLogo from './TraderNinjaLogo';

export default function Footer() {
    return (
        <footer style={{
            background: '#020617',
            borderTop: '1px solid var(--ninja-border)',
            padding: '40px 0 20px',
            color: 'var(--text-secondary)',
            fontSize: 14,
            marginTop: 'auto'
        }}>
            <div className="container" style={{ padding: '0 24px' }}>
                <div className="footer-grid">
                    {/* Brand */}
                    <div className="footer-brand">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, color: 'white' }}>
                            <TraderNinjaLogo width={28} height={28} />
                            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em' }}>
                                KAGE<span className="text-gradient"> AI</span>
                            </span>
                        </div>
                        <p style={{ lineHeight: 1.6, maxWidth: 280, fontSize: 13, color: '#64748b' }}>
                            AI-powered stock analysis for the modern trader.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-links">
                        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Platform</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <FooterLink to="/market">Market Overview</FooterLink>
                            <FooterLink to="/penny">Penny Stocks</FooterLink>
                            <FooterLink to="/pro">Pro Intelligence</FooterLink>
                        </div>
                    </div>

                    {/* Legal */}
                    <div className="footer-links">
                        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Legal</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <FooterLink to="/terms">Terms of Service</FooterLink>
                            <FooterLink to="/privacy">Privacy Policy</FooterLink>
                            <FooterLink to="/disclaimer">Risk Disclaimer</FooterLink>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom" style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: 20,
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                    marginTop: 32,
                    fontSize: 12,
                    color: '#475569'
                }}>
                    <div>
                        &copy; {new Date().getFullYear()} KAGE AI. All rights reserved.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Shield size={12} />
                        <span>Not financial advice. Use at your own risk.</span>
                    </div>
                </div>
            </div>

            <style>{`
                .footer-grid {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr 1fr;
                    gap: 40px;
                }
                @media (max-width: 640px) {
                    .footer-grid {
                        grid-template-columns: 1fr;
                        gap: 24px;
                        text-align: center;
                    }
                    .footer-brand {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .footer-links {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .footer-bottom {
                        flex-direction: column;
                        text-align: center;
                    }
                }
            `}</style>
        </footer>
    );
}

const FooterLink = ({ to, children }) => (
    <Link to={to} style={{
        color: '#94a3b8',
        textDecoration: 'none',
        transition: 'color 0.2s',
        fontSize: 13
    }}
        onMouseEnter={e => e.target.style.color = 'var(--primary)'}
        onMouseLeave={e => e.target.style.color = '#94a3b8'}
    >
        {children}
    </Link>
);
