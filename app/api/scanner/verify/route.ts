export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getStudentByQrId, getGuestById, updateStudent, markGuestScanned } from '@/lib/rsvpService';

export async function POST(req: Request) {
  const body = await req.json();
  let { id } = body;
  console.log('[Scanner] Looking up ID:', id);

  const match = String(id || '').match(/\/verify\/(?:guest|student)\/([a-f0-9-]+)/);
  if (match) {
    id = match[1];
    console.log('[Scanner] Normalized ID from URL to:', id);
  }

  if (!id) return NextResponse.json({ status: 'invalid' });

  const student = await getStudentByQrId(id);
  console.log('[Scanner] Student lookup result:', student);
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

  const guest = await getGuestById(id);
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

    await markGuestScanned(id);
    return NextResponse.json({ status: 'success', name, type: 'Invité(e)' });
  }

  return NextResponse.json({ status: 'invalid' });
}
