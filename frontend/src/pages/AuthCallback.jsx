import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ErrorDisplay from '../components/ErrorDisplay';

/**
 * Dedicated OAuth callback handler.
 * Supabase redirects here with tokens in the URL hash fragment.
 * We extract them, call setSession(), then redirect to /penny.
 */
export default function AuthCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        handleCallback();
    }, []);

    async function handleCallback() {
        try {
            // Parse hash fragment: #access_token=xxx&refresh_token=xxx&...
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);

            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (!accessToken || !refreshToken) {
                // No tokens — maybe user navigated here directly
                console.warn('[AuthCallback] No tokens in URL, redirecting to login');
                navigate('/login', { replace: true });
                return;
            }

            // Set the session manually
            const { data, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            if (sessionError) {
                console.error('[AuthCallback] Session error:', sessionError);
                setError(sessionError.message);
                return;
            }

            if (data.session) {
                console.log('[AuthCallback] Session established for:', data.session.user.email);
                // Check for intent
                const intent = localStorage.getItem('user_intent');
                localStorage.removeItem('user_intent'); // Clear it

                if (intent === 'founder') {
                    navigate('/pro', { replace: true });
                } else {
                    navigate('/penny', { replace: true });
                }
            } else {
                setError('Failed to establish session');
            }
        } catch (err) {
            console.error('[AuthCallback] Unexpected error:', err);
            setError(err.message);
        }
    }

    if (error) {
        return (
            <ErrorDisplay
                title="Authentication Failed"
                message={error}
                onRetry={() => navigate('/login', { replace: true })}
                type="error"
            />
        );
    }

    return (
        <div className="page" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            flexDirection: 'column',
            gap: 16,
        }}>
            <div className="spinner" />
            <p style={{ color: 'var(--text-secondary)' }}>Authenticating...</p>
        </div>
    );
}
