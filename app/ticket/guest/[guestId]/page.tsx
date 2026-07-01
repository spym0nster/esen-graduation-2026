import QRCode from "qrcode";
import { getGuestById } from "@/lib/rsvpService";
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

export default async function GuestTicketPage({
  params,
}: {
  params: Promise<{ guestId: string }>;
}) {
  const { guestId } = await params;
  const guest = await getGuestById(guestId);

  if (!guest) {
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

  const qrDataUrl = await QRCode.toDataURL(`${BASE_URL}/verify/guest/${guest.qrId}`, {
    width: 260,
    margin: 2,
    color: { dark: "#1B3A8C", light: "#FFFFFF" },
  });
  const ticketNumber = guest.qrId.replace(/-/g, "").toUpperCase().slice(0, 8);

  return (
    <div style={pageWrap}>
      <EventTicket
        type="guest"
        name={`Accompagnateur ${guest.guestIndex}`}
        subtitle={`Invité de ${guest.parentName}`}
        qrDataUrl={qrDataUrl}
        ticketNumber={ticketNumber}
      />
    </div>
  );
}
