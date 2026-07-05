import { getStudentByQrId, getVoidedQrIds } from "@/lib/rsvpService";
import { CheckCircle, AlertTriangle, XCircle, ShieldCheck } from "lucide-react";

export const runtime = 'nodejs';

// READ-ONLY status page. Opening this URL (from any QR app) must NOT admit
// anyone — check-in happens exclusively through the password-protected
// scanner (/scanner → /api/scanner/verify). This page only shows status.
export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [student, voided] = await Promise.all([getStudentByQrId(id), getVoidedQrIds()]);

  if (!student) {
    return (
      <div style={{ background: "#1A1A1A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#E05252" }}>
          <XCircle size={64} style={{ margin: "0 auto 16px" }} />
          <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "24px", fontWeight: "bold" }}>✕ QR CODE INVALIDE</h1>
          <p style={{ color: "#999", marginTop: "8px" }}>{"Ce code n'est pas reconnu dans notre système."}</p>
        </div>
      </div>
    );
  }

  if (voided.has(id)) {
    return (
      <div style={{ background: "linear-gradient(135deg, #1A0A0A, #2A0808)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "12px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <XCircle size={64} color="#E05252" style={{ margin: "0 auto 16px" }} />
          <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 700, color: "#E05252", letterSpacing: "3px" }}>✕ BILLET ANNULÉ</h1>
          <p style={{ color: "#444", marginTop: "16px" }}>Ce billet a été annulé et n&apos;est plus valable.</p>
          <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>{"Contactez l'organisation en cas d'erreur."}</p>
        </div>
      </div>
    );
  }

  if (student.scanned) {
    return (
      <div style={{ background: "linear-gradient(135deg, #1A0A0A, #2A0808)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "12px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <AlertTriangle size={64} color="#B8860B" style={{ margin: "0 auto 16px" }} />
          <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 700, color: "#B8860B", letterSpacing: "3px" }}>⚠ DÉJÀ ENTRÉ(E)</h1>
          <p style={{ color: "#444", marginTop: "16px" }}>Ce billet a déjà été validé à l&apos;entrée.</p>
          <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>Entrée : {new Date(student.scannedAt || "").toLocaleString("fr-TN")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(135deg, #0A1A4A, #0F2560)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", padding: "40px", borderRadius: "12px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <ShieldCheck size={64} color="#F0B429" style={{ margin: "0 auto 16px" }} />
        <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 700, color: "#0F2560", letterSpacing: "3px" }}>✓ BILLET VALIDE</h1>
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
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#999", marginTop: "24px", lineHeight: 1.5 }}>
          Présentez ce QR code à l&apos;entrée.<br />Le contrôle d&apos;accès est effectué par le staff.
        </p>
      </div>
    </div>
  );
}
