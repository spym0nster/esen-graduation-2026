export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getStats } from '@/lib/rsvpService';

// Public, aggregate-only counts for the projector "ceremony screen".
// No personal data is exposed — just totals and check-in counts.
export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(
      { totalStudents: 0, totalGuests: 0, totalExpected: 0, studentsCheckedIn: 0, guestsCheckedIn: 0 },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
