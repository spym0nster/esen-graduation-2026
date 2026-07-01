import QRCode from "qrcode";
import { getStudentById } from "@/lib/rsvpService";
import { EventTicket } from "@/components/ui/EventTicket";

export const runtime = "nodejs";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://esen-graduation-2026.vercel.app";

const pageWrap = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0A1A4A 0%, #0F2560 50%, #1C0F06 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  fontFamily: "Arial, sans-serif",
} as const;

export default async function StudentTicketPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = await getStudentById(studentId);

  if (!student) {
    return (
      <div style={pageWrap}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "48px 32px", textAlign: "center", maxWidth: 360, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0F2560", marginBottom: 8 }}>Billet Invalide</div>
          <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>{"Ce billet n'est pas reconnu dans notre système."}</div>
        </div>
      </div>
    );
  }

  const qrDataUrl = await QRCode.toDataURL(`${BASE_URL}/verify/${student.qrId}`, {
    width: 260,
    margin: 2,
    color: { dark: "#0F2560", light: "#FFFFFF" },
  });
  const ticketNumber = student.qrId.replace(/-/g, "").toUpperCase().slice(0, 8);

  return (
    <div style={pageWrap}>
      <div className="w-full max-w-[760px] flex flex-col items-center gap-6">
        <EventTicket
          type="student"
          name={`${student.firstName} ${student.lastName}`}
          subtitle={`${student.classe} · ${student.specialty}`}
          qrDataUrl={qrDataUrl}
          ticketNumber={ticketNumber}
        />

        {student.guestIds && student.guestIds.length > 0 && (
          <div
            className="w-full max-w-[460px] sm:max-w-[760px]"
            style={{ background: "rgba(255,251,240,0.06)", border: "1px solid rgba(240,180,41,0.25)", borderRadius: 12, padding: "14px 18px" }}
          >
            <div style={{ fontSize: 12, color: "#F0B429", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>
              🎟 {student.guestIds.length} billet(s) accompagnateur à partager
            </div>
            {student.guestIds.map((gid, i) => (
              <div key={gid} style={{ fontSize: 12, color: "#F5ECD7", lineHeight: 1.9, wordBreak: "break-all" }}>
                Accompagnateur {i + 1} → {BASE_URL}/ticket/guest/{gid}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
