import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const verseId = url.searchParams.get('verseId');
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '') || null;

    // create admin client lazily (throws if env not set)
    const supabaseAdmin = getSupabaseAdmin();
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
    if (userErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = userData.user.id;

    const { data, error } = await supabaseAdmin.from('notes').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Filter by verseId if provided
    const notes = (Array.isArray(data) ? data : []).filter((n: any) => !verseId || n.verse_id === verseId);
    return NextResponse.json({ notes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Notes fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { verseId, note } = body;
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '') || null;

    const supabaseAdmin = getSupabaseAdmin();
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
    if (userErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = userData.user.id;

    const { data, error } = await supabaseAdmin.from('notes').insert([{ user_id: userId, verse_id: verseId, note }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ note: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Note save failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { verseId } = body;
    if (!verseId) return NextResponse.json({ error: 'verseId required' }, { status: 400 });

    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '') || null;
    const supabaseAdmin = getSupabaseAdmin();
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
    if (userErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = userData.user.id;

    const { error } = await supabaseAdmin.from('notes').delete().eq('user_id', userId).eq('verse_id', verseId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Note delete failed' }, { status: 500 });
  }
}
