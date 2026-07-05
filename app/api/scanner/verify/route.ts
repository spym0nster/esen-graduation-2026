export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getStudentByQrId, getGuestById, updateStudent, updateGuest, getVoidedQrIds } from '@/lib/rsvpService';

export async function POST(req: Request) {
  const body = await req.json();
  let { id } = body;

  // Accept a raw id or any verify URL form (/verify/<id> or /verify/guest/<id>) — extract the UUID.
  const match = String(id || '').match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  if (match) id = match[0];

  if (!id) return NextResponse.json({ status: 'invalid' });

  // Look up student, guest, and voided-list in parallel so a guest scan is as fast
  // as a student scan instead of paying sequential reads.
  const [student, guest, voided] = await Promise.all([
    getStudentByQrId(id),
    getGuestById(id),
    getVoidedQrIds(),
  ]);

  if (voided.has(id)) {
    if (student) {
      return NextResponse.json({
        status: 'voided',
        name: `${student.firstName} ${student.lastName}`,
        type: 'Diplômé(e)',
      });
    }
    if (guest) {
      return NextResponse.json({
        status: 'voided',
        name: `Accompagnateur ${guest.guestIndex} de ${guest.parentName}`,
        type: 'Invité(e)',
      });
    }
    return NextResponse.json({ status: 'voided' });
  }

  if (student) {
    if (student.scanned) {
      return NextResponse.json({
        status: 'already_scanned',
        name: `${student.firstName} ${student.lastName}`,
        scannedAt: student.scannedAt,
        type: 'Diplômé(e)',
      });
    }

    student.scanned = true;
    student.scannedAt = new Date().toISOString();
    await updateStudent(student);

    return NextResponse.json({
      status: 'success',
      name: `${student.firstName} ${student.lastName}`,
      type: 'Diplômé(e)',
    });
  }

  if (guest) {
    const name = `Accompagnateur ${guest.guestIndex} de ${guest.parentName}`;
    if (guest.scanned) {
      return NextResponse.json({
        status: 'already_scanned',
        name,
        scannedAt: guest.scannedAt,
        type: 'Invité(e)',
      });
    }

    // Reuse the guest we already fetched (it carries _rowIndex) instead of
    // re-reading the whole Guests tab inside markGuestScanned.
    guest.scanned = true;
    guest.scannedAt = new Date().toISOString();
    await updateGuest(guest);
    return NextResponse.json({ status: 'success', name, type: 'Invité(e)' });
  }

  return NextResponse.json({ status: 'invalid' });
}
