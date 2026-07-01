import Image from "next/image";

export interface EventTicketProps {
  type: "student" | "guest";
  name: string;
  subtitle: string;
  qrDataUrl: string;
  ticketNumber: string;
}

// Colour used for the punched "notch" holes — approximates the page background gradient
// so the cut-outs read as holes torn through the ticket edge.
const NOTCH_BG = "#0A1A4A";

export function EventTicket({ type, name, subtitle, qrDataUrl, ticketNumber }: EventTicketProps) {
  const isStudent = type === "student";
  const badgeLabel = isStudent ? "DIPLÔMÉ(E)" : "INVITÉ(E)";
  const badgeStyle = isStudent
    ? { background: "#F0B429", color: "#0F2560", border: "1px solid #F0B429" }
    : { background: "transparent", color: "#F0B429", border: "1px solid #F0B429" };

  return (
    <div
      className="relative w-full max-w-[460px] sm:max-w-[760px] flex flex-col sm:flex-row rounded-2xl overflow-hidden"
      style={{
        border: "1px solid rgba(240,180,41,0.3)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* ───── MAIN STUB ───── */}
      <div
        className="relative flex-1 p-6 sm:p-9 flex flex-col justify-between gap-7"
        style={{ background: "linear-gradient(135deg, #0F2560 0%, #1B3A8C 100%)" }}
      >
        {/* Top row: wordmark + type badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, color: "#FFFFFF", fontSize: 24, letterSpacing: 4, lineHeight: 1 }}>
              ESEN
            </div>
            <div style={{ color: "#F0B429", fontSize: 10, letterSpacing: 3, marginTop: 6 }}>
              GRADUATION 2026
            </div>
          </div>
          <span
            className="shrink-0"
            style={{ ...badgeStyle, borderRadius: 999, padding: "6px 15px", fontSize: 11, fontWeight: 700, letterSpacing: 1, whiteSpace: "nowrap" }}
          >
            {badgeLabel}
          </span>
        </div>

        {/* Attendee */}
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#FFFFFF", fontSize: 25, fontWeight: 700, lineHeight: 1.15 }}>
            {name}
          </div>
          <div style={{ color: "#F0B429", fontSize: 13, marginTop: 6 }}>{subtitle}</div>

          <div style={{ height: 1, background: "rgba(240,180,41,0.3)", margin: "18px 0" }} />

          {/* Event details */}
          <div className="flex flex-wrap gap-x-5 gap-y-2" style={{ color: "#F5ECD7", fontSize: 12.5 }}>
            <span>📅 9 Juillet 2026</span>
            <span>🕓 16:00</span>
            <span>📍 UTICA</span>
          </div>
        </div>

        {/* Ticket number */}
        <div style={{ fontFamily: "ui-monospace, 'Courier New', monospace", color: "rgba(245,236,215,0.55)", fontSize: 11, letterSpacing: 2 }}>
          N° {ticketNumber}
        </div>
      </div>

      {/* ───── QR STUB ───── */}
      <div
        className="relative flex flex-col items-center justify-center gap-3 p-6 border-t-2 border-dashed sm:border-t-0 sm:border-l-2 sm:w-[34%]"
        style={{
          background: "#0F2560",
          borderColor: "rgba(240,180,41,0.4)",
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(240,180,41,0.05) 0, rgba(240,180,41,0.05) 1px, transparent 1px, transparent 9px)",
        }}
      >
        {/* Perforation notches: top-left always; second is top-right on mobile, bottom-left on desktop */}
        <span className="absolute -top-3 -left-3 w-6 h-6 rounded-full" style={{ background: NOTCH_BG }} />
        <span
          className="absolute -top-3 -right-3 w-6 h-6 rounded-full sm:top-auto sm:-bottom-3 sm:right-auto sm:-left-3"
          style={{ background: NOTCH_BG }}
        />

        {/* Vertical edge label (desktop) */}
        <div
          className="hidden sm:block absolute right-1.5 top-1/2"
          style={{ transform: "translateY(-50%)", writingMode: "vertical-rl", color: "rgba(240,180,41,0.4)", fontSize: 8, letterSpacing: 2, whiteSpace: "nowrap" }}
        >
          ESEN GRADUATION 2026
        </div>

        {/* QR card */}
        <div style={{ background: "#FFFFFF", borderRadius: 8, padding: 8 }}>
          <Image src={qrDataUrl} alt="QR Code" width={150} height={150} unoptimized style={{ display: "block", width: 150, height: 150 }} />
        </div>

        <div style={{ color: "#F0B429", fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>VALABLE 1 ENTRÉE</div>
      </div>
    </div>
  );
}
