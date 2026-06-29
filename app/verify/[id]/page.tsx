import { getStudentByQrId, updateStudent } from "@/lib/rsvpService";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default async function VerifyPage({ params }: { params: { id: string } }) {
  const student = await getStudentByQrId(params.id);

  if (!student) {
    return (
      <div style={{ background: "#1A1A1A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#E05252" }}>
          <XCircle size={64} style={{ margin: "0 auto 16px" }} />
          <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "24px", fontWeight: "bold" }}>✕ QR CODE INVALIDE</h1>
          <p style={{ color: "#999", marginTop: "8px" }}>Ce code n'est pas reconnu dans notre système.</p>
        </div>
      </div>
    );
  }

  const alreadyScanned = student.scanned;

  if (!alreadyScanned) {
    student.scanned = true;
    student.scannedAt = new Date().toISOString();
    await updateStudent(student);
  }

  if (alreadyScanned) {
    return (
      <div style={{ background: "linear-gradient(135deg, #1A0A0A, #2A0808)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "12px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <AlertTriangle size={64} color="#B8860B" style={{ margin: "0 auto 16px" }} />
          <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 700, color: "#B8860B", letterSpacing: "3px" }}>⚠ DÉJÀ SCANNÉ</h1>
          <p style={{ color: "#444", marginTop: "16px" }}>Ce QR code a déjà été utilisé.</p>
          <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>Premier scan : {new Date(student.scannedAt || "").toLocaleString()}</p>
          <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>Contactez l'organisation en cas d'erreur.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(135deg, #0A1A4A, #0F2560)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: "40px", borderRadius: "12px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <CheckCircle size={64} color="#F0B429" fill="#F0B429" style={{ margin: "0 auto 16px" }} />
        <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 700, color: "#0F2560", letterSpacing: "3px" }}>✓ ENTRÉE AUTORISÉE</h1>
        <div style={{ width: "60px", height: "2px", background: "#F0B429", margin: "16px auto" }}></div>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "24px", fontWeight: 700, color: "#0F2560", margin: "0 0 8px" }}>
          {student.firstName} {student.lastName}
        </h2>
        <div style={{ display: "inline-block", background: "#1B3A8C", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, letterSpacing: "1px", marginBottom: "16px" }}>
          DIPLÔMÉ(E)
        </div>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#666", margin: "0 0 8px" }}>
          {student.classe} · {student.specialty}
        </p>
        {student.guestCount > 0 && (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 500, color: "#1B3A8C", margin: "8px 0" }}>
            {student.guestCount} accompagnateur(s) autorisé(s)
          </p>
        )}
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#999", marginTop: "24px" }}>
          Scanné à {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
