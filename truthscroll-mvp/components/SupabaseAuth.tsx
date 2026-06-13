"use client";
import { useEffect, useState } from 'react';
import getSupabaseClient from '@/lib/supabaseClient';

export default function SupabaseAuth() {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  async function signIn() {
    setLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase) { alert('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'); setLoading(false); return; }
    await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    alert('Check your email for the login link (magic link).');
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }

  if (user) {
    return (
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <span style={{color:'#94a3b8'}}>{user.email}</span>
        <button onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div style={{display:'flex', gap:8}}>
      <input placeholder="you@church.org" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button onClick={signIn} disabled={loading}>{loading ? 'Sending...' : 'Sign in'}</button>
    </div>
  );
}
