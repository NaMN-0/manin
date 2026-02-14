
import React, { useState, useEffect } from 'react';
import { NinjaMeditating, NinjaCharting, NinjaRocket, NinjaChaos, NinjaLogic, NinjaSlicing } from './NinjaIllustrations';

// Narrative Sequence
const SEQUENCE = [
    { text: "Connecting Neural Net...", Component: NinjaMeditating },
    { text: "Deciphering Market Chaos...", Component: NinjaChaos },
    { text: "Aligning Logic Matrices...", Component: NinjaLogic },
    { text: "Precision Strike Ready.", Component: NinjaSlicing }
];

export default function SmartLoader({ sequence }) {
    const [step, setStep] = useState(0);

    const activeSequence = sequence || SEQUENCE;

    useEffect(() => {
        // Progress through sequence, holding longer on earlier steps
        const times = [2000, 2500, 2000, 1500];

        const timer = setTimeout(() => {
            if (step < activeSequence.length - 1) {
                setStep(prev => prev + 1);
            }
        }, times[step] || 2000);

        return () => clearTimeout(timer);
    }, [step]);

    const CurrentComp = activeSequence[step].Component;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', minHeight: 400, width: '100%', color: 'white',
            fontFamily: '"JetBrains Mono", monospace'
        }}>
            <div style={{
                position: 'relative', width: 200, height: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 32
            }}>
                {/* Visual Transition Container */}
                <div key={step} style={{ animation: 'popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    <CurrentComp width={160} height={160} />
                </div>

                {/* Background Ring */}
                <div style={{
                    position: 'absolute', inset: 0, border: '1px dashed rgba(255,255,255,0.1)',
                    borderRadius: '50%', animation: 'spin 10s linear infinite'
                }} />
            </div>

            <h3 key={step + 'text'} style={{
                fontSize: 16, fontWeight: 500, letterSpacing: '0.05em',
                animation: 'slideUpFade 0.5s ease-out', color: step === 3 ? 'var(--primary)' : 'var(--text-secondary)'
            }}>
                {activeSequence[step].text}
            </h3>

            {/* Progress Bar */}
            <div style={{ width: 140, height: 2, background: 'rgba(255,255,255,0.1)', marginTop: 24, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', background: 'var(--primary)',
                    width: `${((step + 1) / activeSequence.length) * 100}%`,
                    transition: 'width 0.5s ease-out'
                }} />
            </div>

            <style>{`
                @keyframes popIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
                @keyframes slideUpFade { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
