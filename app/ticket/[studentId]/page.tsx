import { notFound } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import { getStudentById } from "@/lib/rsvpService";

export const runtime = 'nodejs';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://esen-graduation.vercel.app";

export default async function StudentTicketPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = await getStudentById(studentId);

  if (!student) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0A1A4A 0%, #0F2560 50%, #1C0F06 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}>
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "48px 32px",
          textAlign: "center",
          maxWidth: "360px",
          width: "100%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
          <div style={{ fontSize: "18px", fontWeight: "700", color: "#0F2560", marginBottom: "8px" }}>
            Billet Invalide
          </div>
          <div style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>
            Ce billet n&apos;est pas reconnu dans notre système.
          </div>
        </div>
      </div>
    );
  }

  const qrDataUrl = await QRCode.toDataURL(
    `${BASE_URL}/verify/student/${student.qrId}`,
    { width: 260, margin: 2, color: { dark: "#0F2560", light: "#FFFFFF" } }
  );

  const ticketNumber = student.qrId.replace(/-/g, "").toUpperCase().slice(0, 8);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0A1A4A 0%, #0F2560 50%, #1C0F06 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "Arial, sans-serif",
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "16px",
        overflow: "hidden",
        maxWidth: "420px",
        width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(240,180,41,0.3)",
      }}>
        {/* HEADER BAND */}
        <div style={{
          background: "linear-gradient(135deg, #0F2560, #1B3A8C)",
          padding: "28px 24px 24px",
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: "Georgia, serif",
            fontSize: "26px",
            color: "#FFFFFF",
            letterSpacing: "4px",
            fontWeight: 700,
          }}>ESEN</div>
          <div style={{
            fontSize: "11px",
            color: "#F0B429",
            letterSpacing: "3px",
            marginTop: "6px",
            textTransform: "uppercase" as const,
          }}>Graduation Ceremony 2026</div>
          <div style={{
            width: "40px",
            height: "1px",
            background: "rgba(240,180,41,0.5)",
            margin: "14px auto 0",
          }} />
        </div>

        {/* PERFORATED SEPARATOR */}
        <div style={{
          borderTop: "2px dashed rgba(240,180,41,0.3)",
          margin: "0",
          background: "#f8f9ff",
        }} />

        {/* TICKET BODY */}
        <div style={{ padding: "28px 24px" }}>
          {/* Label */}
          <div style={{
            fontSize: "10px",
            color: "#1B3A8C",
            letterSpacing: "3px",
            textTransform: "uppercase" as const,
            textAlign: "center",
            fontWeight: 700,
          }}>Student Ticket</div>

          {/* Student name */}
          <div style={{
            fontSize: "20px",
            color: "#0F2560",
            fontWeight: 700,
            textAlign: "center",
            marginTop: "8px",
          }}>
            {student.firstName} {student.lastName}
          </div>
          <div style={{
            fontSize: "13px",
            color: "#1B3A8C",
            textAlign: "center",
            marginTop: "4px",
            letterSpacing: "1px",
          }}>
            {student.classe} · {student.specialty}
          </div>

          {/* Gold divider */}
          <div style={{
            width: "100%",
            height: "1px",
            background: "rgba(240,180,41,0.3)",
            margin: "20px 0",
          }} />

          {/* QR Code */}
          <div style={{
            padding: "16px",
            background: "#F8F9FF",
            borderRadius: "12px",
            border: "2px solid #E8EEFF",
            textAlign: "center",
          }}>
            <Image
              src={qrDataUrl}
              width={220}
              height={220}
              alt="QR Code"
              unoptimized
              style={{ display: "block", margin: "0 auto", borderRadius: "8px" }}
            />
          </div>

          {/* Gold divider */}
          <div style={{
            width: "100%",
            height: "1px",
            background: "rgba(240,180,41,0.3)",
            margin: "20px 0",
          }} />

          {/* Event info */}
          <div style={{ textAlign: "center", lineHeight: "2.2" }}>
            <div style={{ fontSize: "13px", color: "#444" }}>📅 9 Juillet 2026</div>
            <div style={{ fontSize: "13px", color: "#444" }}>🕓 16:00</div>
            <div style={{ fontSize: "13px", color: "#444" }}>📍 UTICA, Tunis</div>
          </div>

          {/* Gold divider */}
          <div style={{
            width: "100%",
            height: "1px",
            background: "rgba(240,180,41,0.3)",
            margin: "20px 0",
          }} />

          {/* Guest links box */}
          {student.guestIds && student.guestIds.length > 0 && (
            <div style={{
              background: "#FFFBF0",
              border: "1px solid rgba(240,180,41,0.4)",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "16px",
            }}>
              <div style={{ fontSize: "12px", color: "#B8860B", fontWeight: 600, marginBottom: "8px" }}>
                🎟 Vous avez {student.guestIds.length} billet(s) invité à partager
              </div>
              {student.guestIds.map((gid, i) => (
                <div key={gid} style={{ fontSize: "11px", color: "#1B3A8C", lineHeight: "1.8" }}>
                  Invité {i + 1} → {BASE_URL}/ticket/guest/{gid}
                </div>
              ))}
            </div>
          )}

          {/* Ticket number */}
          <div style={{
            fontSize: "10px",
            color: "#999",
            letterSpacing: "2px",
            textAlign: "center",
            textTransform: "uppercase" as const,
          }}>
            TICKET N° {ticketNumber}
          </div>
        </div>

        {/* BOTTOM BAND */}
        <div style={{
          background: "#F8F9FF",
          borderTop: "1px solid #E8EEFF",
          padding: "14px 24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "11px", color: "#666", letterSpacing: "0.5px" }}>
            ⚠ Ce billet est valable pour une seule entrée
          </div>
        </div>
      </div>
    </div>
  );
}
