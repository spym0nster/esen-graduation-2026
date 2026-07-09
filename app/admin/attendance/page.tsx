"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PersonPresent { id: string; name: string; scannedAt?: string }
interface PersonAbsent { id: string; name: string }
interface Group {
  label: string;
  classe: string;
  specialty: string;
  present: PersonPresent[];
  absent: PersonAbsent[];
}
interface AttendanceData {
  lastUpdated: string;
  totalPresent: number;
  totalStudents: number;
  groups: Group[];
}

const REFRESH_MS = 30000;

export default function AttendancePage() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [authed, setAuthed] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_MS / 1000);
  const [openAbsent, setOpenAbsent] = useState<Set<string>>(new Set());
  // Driven by beforeprint/afterprint rather than a CSS @media print override:
  // Chrome's print pagination doesn't reliably re-flow a display:grid/flex
  // container when its display is only switched via a print stylesheet, so
  // we swap to plain block layout in React before the print engine paginates.
  const [isPrinting, setIsPrinting] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/attendance", { cache: "no-store" });
      if (res.status === 401) { setAuthed(false); return; }
      const json = await res.json();
      setAuthed(true);
      setData(json);
      setSecondsLeft(REFRESH_MS / 1000);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  useEffect(() => {
    const before = () => setIsPrinting(true);
    const after = () => setIsPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  const toggleAbsent = (key: string) => {
    setOpenAbsent((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!authed) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0F2560", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", gap: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Session requise</div>
        <a href="/admin" style={{ padding: "10px 22px", borderRadius: 8, background: "#0A1A4A", border: "1px solid #F0B429", color: "#F0B429", textDecoration: "none", fontWeight: 600 }}>Aller à /admin</a>
      </div>
    );
  }

  const totalPresent = data?.totalPresent ?? 0;
  const totalStudents = data?.totalStudents ?? 0;
  const progressPct = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;
  const lastUpdatedLabel = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleTimeString("fr-TN", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Africa/Tunis" })
    : "—";

  return (
    <div style={{ minHeight: "100dvh", background: isPrinting ? "#fff" : "#0F2560", color: isPrinting ? "#000" : "#fff", fontFamily: "'Inter','Segoe UI',sans-serif", paddingBottom: isPrinting ? 0 : 90 }}>
      {!isPrinting && (
        <div style={{ padding: "clamp(16px,3vw,32px) clamp(16px,3vw,32px) 8px" }}>
          <div style={{ textAlign: "center", fontSize: "clamp(20px,3.2vw,38px)", fontWeight: 800, color: "#F0B429", letterSpacing: 1 }}>
            🎓 ESEN GRADUATION 2026 — PRÉSENCES EN TEMPS RÉEL
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "clamp(16px,4vw,48px)", marginTop: 18, flexWrap: "wrap" }}>
            <div style={{ fontSize: "clamp(18px,2.4vw,28px)", fontWeight: 700 }}>
              ✅ <span style={{ color: "#F0B429" }}>{totalPresent}</span> Présents
            </div>
            <div style={{ fontSize: "clamp(18px,2.4vw,28px)", fontWeight: 700 }}>
              📋 <span style={{ color: "#F0B429" }}>{totalStudents}</span> Inscrits
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
            Dernière mise à jour : {lastUpdatedLabel} · Actualisation dans {secondsLeft}s
          </div>

          <div style={{ textAlign: "center", marginTop: 14 }}>
            <button
              onClick={() => window.print()}
              style={{ padding: "10px 20px", borderRadius: 8, background: "#F0B429", border: "none", color: "#0A1A4A", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              🖨 Imprimer les feuilles (une par spécialité)
            </button>
          </div>
        </div>
      )}

      <div
        style={
          isPrinting
            ? { display: "block" }
            : { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, padding: "16px clamp(16px,3vw,32px)" }
        }
        className="attendance-grid"
      >
        {(data?.groups ?? []).map((g, gi) => {
          const key = `${g.classe}|${g.specialty}`;
          const absentOpen = isPrinting || openAbsent.has(key);
          const isLast = gi === (data?.groups.length ?? 0) - 1;
          return (
            <div
              key={key}
              style={
                isPrinting
                  ? { background: "#fff", color: "#000", pageBreakAfter: isLast ? "auto" : "always", breakAfter: isLast ? "auto" : "page" }
                  : { background: "#1B3A8C", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid rgba(240,180,41,0.25)" }
              }
            >
              <div
                style={
                  isPrinting
                    ? { borderBottom: "2px solid #000", padding: "0 0 10px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }
                    : { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(0,0,0,0.15)" }
                }
              >
                <div style={{ fontWeight: 700, fontSize: isPrinting ? 22 : 16, color: isPrinting ? "#000" : undefined }}>{g.label}</div>
                <div style={
                  isPrinting
                    ? { color: "#000", fontWeight: 800, fontSize: 15, border: "1px solid #000", borderRadius: 12, padding: "3px 10px" }
                    : { background: "#F0B429", color: "#0A1A4A", fontWeight: 800, fontSize: 13, borderRadius: 12, padding: "3px 10px" }
                }>
                  {g.present.length} présents
                </div>
              </div>

              <div>
                {g.present.length === 0 && (
                  <div style={{ padding: "14px 16px", fontSize: 14, color: isPrinting ? "#000" : "rgba(255,255,255,0.5)" }}>Aucun diplômé scanné pour l&apos;instant.</div>
                )}
                {g.present.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 16px",
                      fontSize: 18,
                      color: isPrinting ? "#000" : undefined,
                      borderBottom: isPrinting ? "1px solid #ccc" : undefined,
                      background: isPrinting ? undefined : (i % 2 === 0 ? "rgba(255,255,255,0.04)" : "transparent"),
                    }}
                  >
                    <span>#{i + 1} {p.name}</span>
                    {p.scannedAt && <span style={{ fontSize: 13, color: isPrinting ? "#000" : "#F0B429", fontWeight: 600 }}>{p.scannedAt}</span>}
                  </div>
                ))}
              </div>

              {g.absent.length > 0 && (
                <div style={{ marginTop: isPrinting ? 10 : "auto", borderTop: isPrinting ? "2px solid #000" : "1px solid rgba(255,255,255,0.12)" }}>
                  {!isPrinting && (
                    <button
                      onClick={() => toggleAbsent(key)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        color: "#F0B429",
                        cursor: "pointer",
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {absentOpen ? "▾" : "▸"} ⚠ Non scannés — peut-être absents ({g.absent.length})
                    </button>
                  )}
                  {absentOpen && (
                    <div style={{ padding: isPrinting ? "6px 0 0" : "0 16px 12px" }}>
                      {isPrinting && (
                        <div style={{ fontWeight: 700, fontSize: 13, padding: "6px 0", color: "#000" }}>
                          ⚠ Non scannés — peut-être absents ({g.absent.length})
                        </div>
                      )}
                      {g.absent.map((p) => (
                        <div key={p.id} style={{ fontSize: 14, color: isPrinting ? "#000" : "rgba(240,180,41,0.75)", padding: "3px 0" }}>{p.name}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isPrinting && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "#0A1A4A", borderTop: "1px solid rgba(240,180,41,0.3)", padding: "10px clamp(16px,3vw,32px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <span>Progression</span>
            <span>{totalPresent} / {totalStudents}</span>
          </div>
          <div style={{ height: 10, borderRadius: 6, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "linear-gradient(90deg,#F0B429,#FFD166)",
                borderRadius: 6,
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1100px) {
          .attendance-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 700px) {
          .attendance-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
