import QRCode from "qrcode";
import { jsPDF } from "jspdf";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://esen-graduation.vercel.app";

export interface TicketData {
  type: "student" | "guest";
  name: string;
  subtitle?: string;
  classe?: string;
  specialty?: string;
  qrId: string;
  ticketNumber: string;
  guestIndex?: number;
}

export async function generateTicketPDF(
  studentData: {
    firstName: string;
    lastName: string;
    classe: string;
    specialty: string;
    qrId: string;
  },
  guests: Array<{
    qrId: string;
    guestIndex: number;
  }>
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Generate student QR code
  const studentQrDataUrl = await QRCode.toDataURL(
    `${BASE_URL}/verify/student/${studentData.qrId}`,
    { width: 300, margin: 2, color: { dark: "#0F2560", light: "#FFFFFF" } }
  );

  // Generate guest QR codes
  const guestQrDataUrls = await Promise.all(
    guests.map((guest) =>
      QRCode.toDataURL(`${BASE_URL}/verify/guest/${guest.qrId}`, {
        width: 300,
        margin: 2,
        color: { dark: "#1B3A8C", light: "#FFFFFF" },
      })
    )
  );

  // Page 1: Student Ticket
  await addTicketPage(doc, {
    type: "student",
    name: `${studentData.firstName} ${studentData.lastName}`,
    subtitle: `${studentData.classe} · ${studentData.specialty}`,
    classe: studentData.classe,
    specialty: studentData.specialty,
    qrId: studentData.qrId,
    ticketNumber: studentData.qrId.replace(/-/g, "").toUpperCase().slice(0, 8),
  }, studentQrDataUrl);

  // Guest tickets
  for (let i = 0; i < guests.length; i++) {
    doc.addPage();
    await addTicketPage(doc, {
      type: "guest",
      name: `Guest #${guests[i].guestIndex}`,
      subtitle: `Accompagnateur ${guests[i].guestIndex} de ${studentData.firstName} ${studentData.lastName}`,
      qrId: guests[i].qrId,
      ticketNumber: guests[i].qrId.replace(/-/g, "").toUpperCase().slice(0, 8),
      guestIndex: guests[i].guestIndex,
    }, guestQrDataUrls[i]);
  }

  return Buffer.from(doc.output("arraybuffer"));
}

async function addTicketPage(
  doc: jsPDF,
  data: TicketData,
  qrDataUrl: string
): Promise<void> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background gradient (simulated with rectangles)
  doc.setFillColor(10, 26, 74); // Deep navy
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Header band
  doc.setFillColor(15, 37, 96); // Navy
  doc.rect(0, 0, pageWidth, 40, "F");

  // ESEN logo text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("ESEN", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(240, 180, 41); // Gold
  doc.text("GRADUATION CEREMONY 2026", pageWidth / 2, 30, { align: "center" });

  // Gold line
  doc.setDrawColor(240, 180, 41);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 20, 35, pageWidth / 2 + 20, 35);

  // White card
  const cardY = 50;
  const cardHeight = pageHeight - cardY - 20;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, cardY, pageWidth - 30, cardHeight, 8, 8, "F");

  // Ticket type label
  doc.setTextColor(27, 58, 140);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const label = data.type === "student" ? "STUDENT TICKET" : `GUEST TICKET #${data.guestIndex}`;
  doc.text(label, pageWidth / 2, cardY + 15, { align: "center" });

  // Name
  doc.setTextColor(15, 37, 96);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.name, pageWidth / 2, cardY + 30, { align: "center" });

  // Subtitle
  if (data.subtitle) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(68, 68, 68);
    doc.text(data.subtitle, pageWidth / 2, cardY + 40, { align: "center" });
  }

  // Gold divider
  doc.setDrawColor(240, 180, 41);
  doc.setLineWidth(0.3);
  doc.line(25, cardY + 50, pageWidth - 25, cardY + 50);

  // QR Code
  const qrSize = 50;
  const qrX = pageWidth / 2 - qrSize / 2;
  const qrY = cardY + 60;
  
  // QR background
  doc.setFillColor(248, 249, 255);
  doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 4, 4, "F");
  doc.setDrawColor(232, 238, 255);
  doc.setLineWidth(0.5);
  doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 4, 4, "S");

  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // Gold divider
  doc.setDrawColor(240, 180, 41);
  doc.setLineWidth(0.3);
  doc.line(25, qrY + qrSize + 15, pageWidth - 25, qrY + qrSize + 15);

  // Event info
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(68, 68, 68);
  const infoY = qrY + qrSize + 25;
  doc.text("📅 9 Juillet 2026", pageWidth / 2, infoY, { align: "center" });
  doc.text("🕓 16:00", pageWidth / 2, infoY + 8, { align: "center" });
  doc.text("📍 UTICA, Tunis", pageWidth / 2, infoY + 16, { align: "center" });

  // Gold divider
  doc.setDrawColor(240, 180, 41);
  doc.setLineWidth(0.3);
  doc.line(25, infoY + 26, pageWidth - 25, infoY + 26);

  // Ticket number
  doc.setFontSize(8);
  doc.setTextColor(153, 153, 153);
  doc.setFont("helvetica", "normal");
  doc.text(`TICKET N° ${data.ticketNumber}`, pageWidth / 2, pageHeight - 25, { align: "center" });

  // Warning
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.text("⚠ Ce billet est valable pour une seule entrée", pageWidth / 2, pageHeight - 15, { align: "center" });
}
