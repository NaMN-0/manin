import { Link } from 'react-router-dom';
import { Shield, Github, Twitter, Mail } from 'lucide-react';
import TraderNinjaLogo from './TraderNinjaLogo';

export default function Footer() {
    return (
        <footer style={{
            background: '#020617', // Darker than main bg
            borderTop: '1px solid var(--ninja-border)',
            padding: '48px 0 24px',
            color: 'var(--text-secondary)',
            fontSize: 14,
            marginTop: 'auto'
        }}>
            <div className="container" style={{ padding: '0 24px' }}>
                <div className="footer-grid">
                    {/* Brand */}
                    <div className="footer-brand">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, color: 'white' }}>
                            <TraderNinjaLogo width={32} height={32} />
                            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>
                                KAGE<span className="text-gradient"> AI</span>
                            </span>
                        </div>
                        <p style={{ lineHeight: 1.6, maxWidth: 300, marginBottom: 24, fontSize: 13, color: '#94a3b8' }}>
                            Advanced AI-powered stock analysis for the modern trader.
                            Cut through the noise and find your edge.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <SocialLink icon={Github} href="https://github.com" />
                            <SocialLink icon={Twitter} href="https://twitter.com" />
                            <SocialLink icon={Mail} href="mailto:support@kage.ai" />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-links">
                        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Platform</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <FooterLink to="/market">Market Overview</FooterLink>
                            <FooterLink to="/penny">Penny Stocks</FooterLink>
                            <FooterLink to="/pro">Pro Intelligence</FooterLink>
                            <FooterLink to="/login">Login / Sign Up</FooterLink>
                        </div>
                    </div>

                    {/* Legal */}
                    <div className="footer-links">
                        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Legal</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <FooterLink to="/terms">Terms of Service</FooterLink>
                            <FooterLink to="/privacy">Privacy Policy</FooterLink>
                            <FooterLink to="/disclaimer">Risk Disclaimer</FooterLink>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom" style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: 24,
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: 16,
                    alignItems: 'center',
                    marginTop: 40
                }}>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                        &copy; {new Date().getFullYear()} KAGE AI. All rights reserved.
                    </div>
                    <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#64748b' }}>
                        <span>Made with ⚡ by Ninja Devs</span>
                    </div>
                </div>
            </div>

            <style>{`
                .footer-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 40px;
                }
                @media (max-width: 640px) {
                    .footer-grid {
                        grid-template-columns: 1fr;
                        gap: 32px;
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
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        transition: 'color 0.2s',
        fontSize: 14
    }}
        onMouseEnter={e => e.target.style.color = 'var(--primary)'}
        onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
    >
        {children}
    </Link>
);

const SocialLink = ({ icon: Icon, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(255,255,255,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', transition: 'all 0.2s',
        border: '1px solid rgba(255,255,255,0.08)'
    }}
        onMouseEnter={e => {
            e.target.style.background = 'var(--primary)';
            e.target.style.borderColor = 'var(--primary)';
            e.target.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
            e.target.style.background = 'rgba(255,255,255,0.03)';
            e.target.style.borderColor = 'rgba(255,255,255,0.08)';
            e.target.style.transform = 'translateY(0)';
        }}
    >
        <Icon size={16} />
    </a>
);
