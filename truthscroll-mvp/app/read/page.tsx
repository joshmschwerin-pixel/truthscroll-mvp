import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import ReadClient from './ReadClient';

export default async function ReadPage() {
  // Try to read Supabase access token from cookies (if auth helper sets it)
  let initialNotes: Record<string,string> = {};
  let initialHighlights: Record<string, boolean> = {};

  try {
    const cookieStore: any = cookies();
    const token = (cookieStore.get && (cookieStore.get('sb-access-token')?.value || cookieStore.get('sb:token')?.value)) || null;
    if (token) {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: userData } = await supabaseAdmin.auth.getUser(token as string);
      const userId = userData?.user?.id;
      if (userId) {
        const { data: notes } = await supabaseAdmin.from('notes').select('verse_id,note').eq('user_id', userId).limit(100);
        const { data: highs } = await supabaseAdmin.from('highlights').select('verse_id').eq('user_id', userId).limit(500);
        (notes || []).forEach((n: any) => { initialNotes[n.verse_id] = n.note; });
        (highs || []).forEach((h: any) => { initialHighlights[h.verse_id] = true; });
      }
    }
  } catch (err) {
    // ignore server-side errors; client will sync
    console.error('Server-side notes fetch failed', err);
  }

  return <ReadClient initialNotes={initialNotes} initialHighlights={initialHighlights} />;
}
