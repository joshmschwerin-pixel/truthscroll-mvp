import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

async function getUserIdFromToken(token: string | null) {
  if (!token) return null;
  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
  if (userErr || !userData?.user) return null;
  return userData.user.id;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const verseId = url.searchParams.get('verseId');
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '') || null;

    const userId = await getUserIdFromToken(token);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('notes').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
    if (!verseId || note === undefined || note === null) {
      return NextResponse.json({ error: 'verseId and note are required' }, { status: 400 });
    }

    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '') || null;
    const userId = await getUserIdFromToken(token);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing } = await supabaseAdmin.from('notes').select('id').eq('user_id', userId).eq('verse_id', verseId).single();

    let data;
    let error;

    if (existing?.id) {
      const updateResult = await supabaseAdmin.from('notes').update({ note }).eq('id', existing.id).select().single();
      data = updateResult.data;
      error = updateResult.error;
    } else {
      const insertResult = await supabaseAdmin.from('notes').insert([{ user_id: userId, verse_id: verseId, note }]).select().single();
      data = insertResult.data;
      error = insertResult.error;
    }

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
    const userId = await getUserIdFromToken(token);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from('notes').delete().eq('user_id', userId).eq('verse_id', verseId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Note delete failed' }, { status: 500 });
  }
}
