import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const files = fs.readdirSync(dataDir).filter(f => f.startsWith('demo_search_') && f.endsWith('.json'));
    const combined: Record<string, any> = {};
    for (const fn of files) {
      try {
        const raw = fs.readFileSync(path.join(dataDir, fn), 'utf8');
        combined[fn.replace(/\.json$/, '')] = JSON.parse(raw);
      } catch (e) {
        combined[fn] = { error: String(e) };
      }
    }
    return NextResponse.json({ ok: true, reports: combined });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
