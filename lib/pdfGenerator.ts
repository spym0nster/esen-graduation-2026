import QRCode from "qrcode";
import { jsPDF } from "jspdf";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://esen-graduation-2026.vercel.app";

export interface TicketData {
  type: "student" | "guest";
  name: string;
  subtitle?: string;
  qrId: string;
  ticketNumber: string;
  guestIndex?: number;
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/images/logos/ambassadors.png`);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function generateTicketPDF(
  studentData: {
    firstName: string;
    lastName: string;
    classe: string;
    specialty: string;
    qrId: string;
  },
  guests: Array<{ qrId: string; guestIndex: number }>
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const logoDataUrl = await loadLogoDataUrl();

  const studentQrDataUrl = await QRCode.toDataURL(`${BASE_URL}/verify/${studentData.qrId}`, {
    width: 360,
    margin: 1,
    color: { dark: "#0F2560", light: "#FFFFFF" },
  });

  const guestQrDataUrls = await Promise.all(
    guests.map((g) =>
      QRCode.toDataURL(`${BASE_URL}/verify/guest/${g.qrId}`, {
        width: 360,
        margin: 1,
        color: { dark: "#1B3A8C", light: "#FFFFFF" },
      })
    )
  );

  addTicketPage(
    doc,
    {
      type: "student",
      name: `${studentData.firstName} ${studentData.lastName}`,
      subtitle: `${studentData.classe} · ${studentData.specialty}`,
      qrId: studentData.qrId,
      ticketNumber: studentData.qrId.replace(/-/g, "").toUpperCase().slice(0, 8),
    },
    studentQrDataUrl,
    logoDataUrl
  );

  for (let i = 0; i < guests.length; i++) {
    doc.addPage();
    addTicketPage(
      doc,
      {
        type: "guest",
        name: `Accompagnateur ${guests[i].guestIndex}`,
        subtitle: `Invité de ${studentData.firstName} ${studentData.lastName}`,
        qrId: guests[i].qrId,
        ticketNumber: guests[i].qrId.replace(/-/g, "").toUpperCase().slice(0, 8),
        guestIndex: guests[i].guestIndex,
      },
      guestQrDataUrls[i],
      logoDataUrl
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}

function addTicketPage(doc: jsPDF, data: TicketData, qrDataUrl: string, logoDataUrl: string | null): void {
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();

  // Page background (also the notch "hole" colour)
  doc.setFillColor(10, 26, 74); // #0A1A4A
  doc.rect(0, 0, PW, PH, "F");

  // Horizontal ticket card
  const tw = 174;
  const th = 92;
  const tx = (PW - tw) / 2;
  const ty = (PH - th) / 2;
  const left = tx + 12;

  doc.setFillColor(15, 37, 96); // #0F2560
  doc.roundedRect(tx, ty, tw, th, 5, 5, "F");
  doc.setDrawColor(240, 180, 41);
  doc.setLineWidth(0.4);
  doc.roundedRect(tx, ty, tw, th, 5, 5, "S");

  const perfX = tx + tw * 0.66;

  // ── Main stub ──
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ESEN", left, ty + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(240, 180, 41);
  doc.text("GRADUATION 2026", left, ty + 22);

  // Type badge (top-right of main stub)
  const isStudent = data.type === "student";
  const badgeText = isStudent ? "DIPLÔMÉ(E)" : "INVITÉ(E)";
  const bw = 36;
  const bh = 8.5;
  const bx = perfX - 10 - bw;
  const by = ty + 10;
  if (isStudent) {
    doc.setFillColor(240, 180, 41);
    doc.roundedRect(bx, by, bw, bh, 4.25, 4.25, "F");
    doc.setTextColor(15, 37, 96);
  } else {
    doc.setDrawColor(240, 180, 41);
    doc.setLineWidth(0.4);
    doc.roundedRect(bx, by, bw, bh, 4.25, 4.25, "S");
    doc.setTextColor(240, 180, 41);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(badgeText, bx + bw / 2, by + 5.6, { align: "center" });

  // Attendee name
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(19);
  doc.text(data.name, left, ty + 44, { maxWidth: perfX - left - 6 });

  // Subtitle
  if (data.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(240, 180, 41);
    doc.text(data.subtitle, left, ty + 51, { maxWidth: perfX - left - 6 });
  }

  // Gold divider
  doc.setDrawColor(240, 180, 41);
  doc.setLineWidth(0.2);
  doc.line(left, ty + 57, perfX - 8, ty + 57);

  // Event details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(245, 236, 215);
  doc.text("9 Juillet 2026     ·     16:00     ·     UTICA", left, ty + 66);

  // Ticket number
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(170, 160, 140);
  doc.text(`N° ${data.ticketNumber}`, left, ty + th - 11);

  // ── Perforation (vertical) ──
  doc.setDrawColor(240, 180, 41);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1.6, 1.6], 0);
  doc.line(perfX, ty + 5, perfX, ty + th - 5);
  doc.setLineDashPattern([], 0);
  doc.setFillColor(10, 26, 74);
  doc.circle(perfX, ty, 3, "F");
  doc.circle(perfX, ty + th, 3, "F");

  // ── QR stub ──
  const stubCenterX = perfX + (tx + tw - perfX) / 2;
  const qrSize = 42;
  const qx = stubCenterX - qrSize / 2;
  const qy = ty + 11;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qx - 3.5, qy - 3.5, qrSize + 7, qrSize + 7, 2.5, 2.5, "F");
  doc.addImage(qrDataUrl, "PNG", qx, qy, qrSize, qrSize);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(240, 180, 41);
  doc.text("VALABLE 1 ENTRÉE", stubCenterX, qy + qrSize + 8, { align: "center" });

  // ── ESEN Ambassadors logo (in stub) ──
  const footerY = ty + th - 27;
  if (logoDataUrl) {
    const logoSize = 13;
    const padded = logoSize + 4;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(stubCenterX - padded / 2, footerY, padded, padded, 2.5, 2.5, "F");
    doc.addImage(logoDataUrl, "PNG", stubCenterX - logoSize / 2, footerY + 2, logoSize, logoSize);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(240, 180, 41);
  doc.text("ESEN AMBASSADORS", stubCenterX, footerY + (logoDataUrl ? 21 : 3), { align: "center" });
}
