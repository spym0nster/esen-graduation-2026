import { NextRequest, NextResponse } from "next/server";
import { getStudentById, updateStudent, getAllStudents } from "@/lib/rsvpService";
import { sendEmail } from "@/lib/emailService";
import { isAdmin } from "@/lib/adminAuth";
import { buildRSVPEmail } from "@/lib/emailTemplate";
import { VALID_CLASSES, VALID_SPECIALTIES, NON_STUDENT_ROLES } from "@/lib/rsvp";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { studentId, firstName, lastName, email, phone, classe, specialty, resend } = body;
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  const student = await getStudentById(studentId);
  if (!student) return NextResponse.json({ error: "Étudiant introuvable" }, { status: 404 });

  const errors: Record<string, string> = {};

  const fn = String(firstName ?? student.firstName).trim();
  const ln = String(lastName ?? student.lastName).trim();
  if (fn.length < 2) errors.firstName = "Prénom requis (min 2 caractères)";
  if (ln.length < 2) errors.lastName = "Nom requis (min 2 caractères)";

  const newEmail = String(email ?? student.email).trim().toLowerCase();
  if (!emailRegex.test(newEmail)) errors.email = "Email invalide";

  const ph = String(phone ?? student.phone).trim();
  const phoneStripped = ph.replace(/[\s-]/g, "");
  if (!/^\d{8,}$/.test(phoneStripped)) errors.phone = "Téléphone invalide (min 8 chiffres)";

  const cl = String(classe ?? student.classe).trim();
  if (!VALID_CLASSES.includes(cl)) errors.classe = "Classe invalide";

  const isNonStudent = NON_STUDENT_ROLES.includes(cl);
  const sp = String(specialty ?? student.specialty ?? "").trim();
  if (!isNonStudent && !VALID_SPECIALTIES.includes(sp)) errors.specialty = "Spécialité invalide";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Champs invalides", fields: errors }, { status: 400 });
  }

  if (newEmail !== student.email.toLowerCase()) {
    const all = await getAllStudents();
    const dup = all.find((s) => s.id !== studentId && s.email.toLowerCase() === newEmail);
    if (dup) {
      return NextResponse.json(
        { error: `Cet email est déjà utilisé par ${dup.firstName} ${dup.lastName}` },
        { status: 409 }
      );
    }
  }

  student.firstName = fn;
  student.lastName = ln;
  student.email = newEmail;
  student.phone = ph;
  student.classe = cl;
  student.specialty = isNonStudent ? "" : sp;

  if (resend) {
    try {
      const entry = {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        classe: student.classe,
        specialty: student.specialty,
        guestCount: student.guestCount,
      };
      await sendEmail({
        to: student.email,
        subject: "Votre Invitation Officielle – Cérémonie de Remise des Diplômes ESEN 2026",
        html: buildRSVPEmail(entry, studentId, student.guestIds || []),
      });
      student.emailStatus = "Sent";
    } catch (err) {
      await updateStudent(student);
      const details = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: "Données mises à jour mais l'envoi a échoué", details },
        { status: 500 }
      );
    }
  }

  await updateStudent(student);
  return NextResponse.json({ success: true, resent: !!resend });
}
