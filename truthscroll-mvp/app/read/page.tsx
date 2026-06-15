import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { getAvailableBooks, getAvailableChapters } from '@/lib/bibleData';
import ReadClient from './ReadClient';

type ReadPageProps = {
  searchParams?: {
    book?: string;
    chapter?: string;
  };
};

export default async function ReadPage({ searchParams }: ReadPageProps) {
  let initialNotes: Record<string, string> = {};
  let initialHighlights: Record<string, boolean> = {};

  const availableBooks = getAvailableBooks();
  const defaultBook = availableBooks.includes('John') ? 'John' : availableBooks[0] || '';
  const requestedBook = searchParams?.book && availableBooks.includes(searchParams.book) ? searchParams.book : defaultBook;

  const availableChapters = requestedBook ? getAvailableChapters(requestedBook) : [];
  const defaultChapter = availableChapters.includes(1) ? 1 : availableChapters[0] || 1;
  const requestedChapterNumber = Number(searchParams?.chapter);
  const requestedChapter = availableChapters.includes(requestedChapterNumber) ? requestedChapterNumber : defaultChapter;

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

        (notes || []).forEach((n: any) => {
          initialNotes[n.verse_id] = n.note;
        });

        (highs || []).forEach((h: any) => {
          initialHighlights[h.verse_id] = true;
        });
      }
    }
  } catch (err) {
    console.error('Server-side notes fetch failed', err);
  }

  return (
    <ReadClient
      initialNotes={initialNotes}
      initialHighlights={initialHighlights}
      initialBook={requestedBook}
      initialChapter={requestedChapter}
    />
  );
}