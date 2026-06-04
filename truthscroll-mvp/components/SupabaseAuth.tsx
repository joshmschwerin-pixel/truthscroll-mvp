"use client";
import { useEffect, useState } from 'react';
import getSupabaseClient from '@/lib/supabaseClient';

export default function SupabaseAuth() {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [clientError, setClientError] = useState('');

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setClientError('Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }

    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  async function signIn() {
    if (!email) {
      window.alert('Enter your email to sign in.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      window.alert('Supabase is not configured.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);

    if (error) {
      window.alert(error.message);
      return;
    }

    window.alert('Check your email for the login link (magic link).');
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  if (user) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: '#94a3b8' }}>{user.email}</span>
        <button onClick={signOut}>Sign out</button>
      </div>
    );
  }

  if (clientError) {
    return <div style={{ color: '#c92a2a', fontSize: 12 }}>{clientError}</div>;
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input placeholder="you@church.org" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button onClick={signIn} disabled={loading}>{loading ? 'Sending...' : 'Sign in'}</button>
    </div>
  );
}
