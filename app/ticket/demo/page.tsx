import QRCode from "qrcode";
import { EventTicket } from "@/components/ui/EventTicket";

export const runtime = "nodejs";

// Temporary preview route with mock data so the ticket design can be viewed without
// a live Google Sheets connection. Safe to delete once the real data flow is set up.

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://esen-graduation-2026.vercel.app";

export default async function TicketDemoPage() {
  const studentQr = await QRCode.toDataURL(`${BASE_URL}/verify/demo-student`, {
    width: 260,
    margin: 2,
    color: { dark: "#0F2560", light: "#FFFFFF" },
  });
  const guestQr = await QRCode.toDataURL(`${BASE_URL}/verify/guest/demo-guest`, {
    width: 260,
    margin: 2,
    color: { dark: "#1B3A8C", light: "#FFFFFF" },
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0A1A4A 0%, #0F2560 50%, #1C0F06 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        padding: "48px 24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <EventTicket
        type="student"
        name="Bilel Triki"
        subtitle="L3 · Business Intelligence"
        qrDataUrl={studentQr}
        ticketNumber="A1B2C3D4"
      />
      <EventTicket
        type="guest"
        name="Accompagnateur 1"
        subtitle="Invité de Bilel Triki"
        qrDataUrl={guestQr}
        ticketNumber="E5F6A7B8"
      />
    </div>
  );
}
