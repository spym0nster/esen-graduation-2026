export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getStudentByQrId, getGuestById, updateStudent, markGuestScanned } from '@/lib/rsvpService';

export async function POST(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ status: 'invalid' });

  const student = await getStudentByQrId(id);
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
