
import React from 'react';
import { Shield, FileText, Lock, RefreshCw, AlertTriangle } from 'lucide-react';

const LegalLayout = ({ title, icon: Icon, children }) => (
    <div className="page" style={{ padding: '120px 20px 80px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
                <div style={{
                    width: 64, height: 64, background: 'var(--primary-dark)',
                    borderRadius: 16, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 24px',
                    border: '1px solid var(--primary)',
                    boxShadow: '0 0 20px rgba(14, 165, 233, 0.2)'
                }}>
                    <Icon size={32} color="var(--primary)" />
                </div>
                <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16 }}>{title}</h1>
                <p style={{ color: 'var(--text-muted)' }}>Last Updated: February 14, 2026</p>
            </div>

            <div className="glass-card" style={{ padding: 'clamp(24px, 5vw, 48px)', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                {children}
            </div>
        </div>
    </div>
);

export const TermsOfService = () => (
    <LegalLayout title="Terms of Service" icon={FileText}>
        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>1. Agreement to Terms</h2>
            <p>By accessing KAGE AI, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>2. Description of Service</h2>
            <p>KAGE AI is an AI-powered stock market analysis tool. We provide data visualization, sentiment analysis, and technical scans. Our services are for informational purposes only and do not constitute financial advice.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>3. Early Bird Lifetime Access</h2>
            <p>The "Early Bird" lifetime access plan is a one-time payment for perpetual access to currently available Pro features. We reserve the right to introduce new standalone tiers or features in the future that may not be included in the initial lifetime plan.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>4. User Data</h2>
            <p>You own your data, but you grant us a license to use any data you upload to provide and improve the service. We are not responsible for any loss of data.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>5. Limitation of Liability</h2>
            <p>KAGE AI shall not be held liable for any financial losses incurred through the use of our software. Trading involves significant risk.</p>
        </section>
    </LegalLayout>
);

export const PrivacyPolicy = () => (
    <LegalLayout title="Privacy Policy" icon={Lock}>
        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>1. Information We Collect</h2>
            <p>We collect information you provide directly to us when you create an account, such as your email address and name. We also collect usage data (IP address, browser type) to improve platform performance.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>2. How We Use Data</h2>
            <p>We use your data to maintain your account, process payments via Razorpay, and provide Personalized AI analysis. We never sell your personal information to third parties.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>3. Cookies & Tracking</h2>
            <p>We use essential cookies and analytics tools (like PostHog) to understand user behavior and fix bugs. You can disable cookies in your browser, but some features may stop working.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure.</p>
        </section>
    </LegalLayout>
);

export const RefundPolicy = () => (
    <LegalLayout title="Refund Policy" icon={RefreshCw}>
        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>1. Digital Nature of Service</h2>
            <p>Due to the digital nature of KAGE AI and the instant delivery of Pro features upon purchase, all sales are final.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>2. Exception Requests</h2>
            <p>We understand technical issues can happen. If you were charged but the Pro features were not activated, we will resolve the issue or provide a refund if a resolution is not possible within 48 hours.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>3. Subscription Policy</h2>
            <p>If you choose to switch from a monthly tier to a lifetime plan, previous monthly payments are non-refundable.</p>
        </section>
    </LegalLayout>
);

export const RiskDisclaimer = () => (
    <LegalLayout title="Risk Disclaimer" icon={AlertTriangle}>
        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>1. Not Financial Advice</h2>
            <p>The information provided by KAGE AI, including but not limited to technical analysis, sentiment scores, and AI targets, is for educational and informational purposes only.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>2. Accuracy of Data</h2>
            <p>While we strive for 100% accuracy, market data is complex. KAGE AI does not guarantee the completeness or accuracy of market information provided on the platform.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 16 }}>3. High Risk Disclaimer</h2>
            <p>Trading stocks, especially penny stocks and options, involves substantial risk of loss. Past performance is not indicative of future results.</p>
        </section>
    </LegalLayout>
);
