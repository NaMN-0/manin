import { Link } from 'react-router-dom';
import { Shield, Github, Twitter, Mail } from 'lucide-react';
import TraderNinjaLogo from './TraderNinjaLogo';

export default function Footer() {
    return (
        <footer style={{
            background: '#020617', // Darker than main bg
            borderTop: '1px solid var(--ninja-border)',
            padding: '60px 0 30px',
            color: 'var(--text-secondary)',
            fontSize: 14,
            marginTop: 'auto'
        }}>
            <div className="container" style={{ padding: '0 24px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 40,
                    marginBottom: 60
                }}>
                    {/* Brand */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, color: 'white' }}>
                            <TraderNinjaLogo width={32} height={32} />
                            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>
                                KAGE<span className="text-gradient"> AI</span>
                            </span>
                        </div>
                        <p style={{ lineHeight: 1.6, maxWidth: 300, marginBottom: 24 }}>
                            Advanced AI-powered stock analysis for the modern trader.
                            Cut through the noise and find your edge.
                        </p>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <SocialLink icon={Github} href="https://github.com" />
                            <SocialLink icon={Twitter} href="https://twitter.com" />
                            <SocialLink icon={Mail} href="mailto:support@kage.ai" />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 20 }}>Platform</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <FooterLink to="/market">Market Overview</FooterLink>
                            <FooterLink to="/penny">Penny Stocks</FooterLink>
                            <FooterLink to="/pro">Pro Intelligence</FooterLink>
                            <FooterLink to="/login">Login / Sign Up</FooterLink>
                        </div>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 20 }}>Legal</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <FooterLink to="/terms">Terms of Service</FooterLink>
                            <FooterLink to="/privacy">Privacy Policy</FooterLink>
                            <FooterLink to="/disclaimer">Risk Disclaimer</FooterLink>
                        </div>
                    </div>
                </div>

                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: 30,
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: 20,
                    alignItems: 'center'
                }}>
                    <div>
                        &copy; {new Date().getFullYear()} KAGE AI. All rights reserved.
                    </div>
                    <div style={{ display: 'flex', gap: 24, fontSize: 12 }}>
                        <span>Made with ⚡ by Ninja Devs</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

const FooterLink = ({ to, children }) => (
    <Link to={to} style={{
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        transition: 'color 0.2s'
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
        background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', transition: 'all 0.2s',
        border: '1px solid rgba(255,255,255,0.1)'
    }}
        onMouseEnter={e => {
            e.target.style.background = 'var(--primary)';
            e.target.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={e => {
            e.target.style.background = 'rgba(255,255,255,0.05)';
            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
        }}
    >
        <Icon size={18} />
    </a>
);
