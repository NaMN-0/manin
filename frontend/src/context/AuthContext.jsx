import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);
    const [hasUsedTrial, setHasUsedTrial] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const didRedirect = useRef(false);

    useEffect(() => {
        // Get initial session (Supabase will have already processed any hash tokens
        // via detectSessionInUrl before this runs)
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s) {
                checkProStatus();
                // If we just came from OAuth (hash in URL), redirect to /penny
                if (!didRedirect.current && window.location.hash.includes('access_token')) {
                    didRedirect.current = true;
                    window.history.replaceState(null, '', window.location.pathname);
                    navigate('/penny', { replace: true });
                }
            }
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, s) => {
                console.log('[Auth] Event:', event);
                setSession(s);
                setUser(s?.user ?? null);

                if (event === 'SIGNED_IN' && s && !didRedirect.current) {
                    checkProStatus();
                    didRedirect.current = true;
                    // Clean hash if present
                    if (window.location.hash) {
                        window.history.replaceState(null, '', window.location.pathname);
                    }
                    // Navigate to penny if on landing or login
                    if (location.pathname === '/' || location.pathname === '/login') {
                        navigate('/penny', { replace: true });
                    }
                }

                if (event === 'SIGNED_OUT') {
                    setIsPro(false);
                    didRedirect.current = false;
                }

                if (event === 'TOKEN_REFRESHED' && s) {
                    checkProStatus();
                }

                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    async function checkProStatus() {
        try {
            const res = await api.get('/payments/status');
            setIsPro(res.data?.data?.isPro || false);
            setHasUsedTrial(res.data?.data?.hasUsedTrial || false);
        } catch {
            setIsPro(false);
            setHasUsedTrial(false);
        }
    }

    async function signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) console.error('Login error:', error.message);
    }

    async function signOut() {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setIsPro(false);
        navigate('/', { replace: true });
    }

    return (
        <AuthContext.Provider value={{ user, session, loading, isPro, hasUsedTrial, signInWithGoogle, signOut, checkProStatus }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
