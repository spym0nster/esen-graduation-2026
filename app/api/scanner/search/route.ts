export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getAllStudents, getAllGuests } from '@/lib/rsvpService';
import { isScannerAuthed } from '@/lib/scannerAuth';

// Fallback lookup for check-in when a QR code won't scan. Returns matching
// students and guests with the id to pass to /api/scanner/verify.
export async function GET(req: Request) {
  if (!(await isScannerAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const q = (new URL(req.url).searchParams.get('q') || '').trim().toLowerCase();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [students, guests] = await Promise.all([getAllStudents(), getAllGuests()]);
  const results: Array<{
    id: string;
    name: string;
    type: string;
    detail?: string;
    scanned: boolean;
  }> = [];

  for (const s of students) {
    const name = `${s.firstName} ${s.lastName}`.trim();
    if (name.toLowerCase().includes(q)) {
      results.push({
        id: s.qrId || s.id, // verify() resolves students by qrId
        name,
        type: 'Diplômé(e)',
        detail: [s.classe, s.specialty].filter(Boolean).join(' · '),
        scanned: s.scanned,
      });
    }
  }

  for (const g of guests) {
    if ((g.parentName || '').toLowerCase().includes(q)) {
      results.push({
        id: g.id, // verify() resolves guests by id
        name: `Accompagnateur n°${g.guestIndex} de ${g.parentName}`,
        type: 'Invité(e)',
        scanned: g.scanned,
      });
    }
  }

  return NextResponse.json({ results: results.slice(0, 20) });
}
