"use client";

import { useEffect, useRef, useState } from "react";
import { programmeItems } from "@/data/programme";

interface Stats {
  totalStudents: number;
  totalGuests: number;
  totalExpected: number;
  studentsCheckedIn: number;
  guestsCheckedIn: number;
}

// Ceremony: 9 July 2026, 16:00 Tunisia time (UTC+1, no DST) — matches the site countdown.
const EVENT_DAY = "2026-07-09";
const TARGET = new Date(`${EVENT_DAY}T16:00:00+01:00`).getTime();
const itemStart = (t: string) => new Date(`${EVENT_DAY}T${t}:00+01:00`).getTime();
const STATS_MS = 3000;

const pad = (n: number) => String(n).padStart(2, "0");

export default function CeremonyScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [now, setNow] = useState<number>(TARGET); // SSR-safe seed; replaced on mount
  const [mounted, setMounted] = useState(false);
  const statsTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live clock (1s)
  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Live stats (3s)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/public/stats", { cache: "no-store" });
        const data: Stats = await res.json();
        setStats(data);
      } catch {}
    };
    load();
    statsTimer.current = setInterval(load, STATS_MS);
    return () => { if (statsTimer.current) clearInterval(statsTimer.current); };
  }, []);

  const diff = Math.max(0, TARGET - now);
  const started = diff === 0;
  const cd = {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };

  const clock = mounted
    ? new Date(now).toLocaleTimeString("fr-TN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";

  // Determine current programme item (last one whose start <= now).
  let currentIdx = -1;
  for (let i = 0; i < programmeItems.length; i++) {
    if (itemStart(programmeItems[i].time) <= now) currentIdx = i;
  }

  const studentsIn = stats?.studentsCheckedIn ?? 0;
  const guestsIn = stats?.guestsCheckedIn ?? 0;

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #060f33 0%, #0A1A4A 45%, #1C0F06 100%)",
      color: "#F5ECD7",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: "clamp(18px, 2.5vw, 40px)",
      display: "flex", flexDirection: "column", gap: "clamp(14px, 2vw, 28px)",
    }}>
      {/* Top bar: brand + live clock */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, color: "#fff", fontSize: "clamp(22px,2.4vw,40px)", letterSpacing: 6 }}>ESEN</div>
          <div style={{ color: "#F0B429", fontSize: "clamp(10px,1vw,15px)", letterSpacing: 4, marginTop: 2 }}>GRADUATION 2026</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "'Courier New', monospace", fontWeight: 700, color: "#fff",
            fontSize: "clamp(30px,4.2vw,68px)", lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: 2,
          }}>{clock}</div>
          <div style={{ color: "rgba(245,236,215,0.6)", fontSize: "clamp(10px,1vw,15px)", letterSpacing: 2, marginTop: 4 }}>
            {mounted ? new Date(now).toLocaleDateString("fr-TN", { weekday: "long", day: "numeric", month: "long" }) : ""}
          </div>
        </div>
      </div>

      {/* Welcome */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#fff", fontSize: "clamp(34px,5vw,84px)", fontWeight: 800, lineHeight: 1 }}>
          Bienvenue
        </div>
        <div style={{ color: "rgba(245,236,215,0.75)", fontSize: "clamp(13px,1.6vw,24px)", marginTop: 8, letterSpacing: 1 }}>
          Cérémonie de Remise des Diplômes
        </div>
        <div style={{ width: "min(40vw,320px)", height: 2, background: "linear-gradient(90deg,transparent,#F0B429,transparent)", margin: "12px auto 0" }} />
      </div>

      {/* Stats + countdown row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "clamp(12px,1.5vw,22px)" }}>
        <StatTile label="DIPLÔMÉS ENTRÉS" value={studentsIn} accent="#60a5fa" />
        <StatTile label="INVITÉS ENTRÉS" value={guestsIn} accent="#c084fc" />
        <StatTile label="TOTAL À L'INTÉRIEUR" value={studentsIn + guestsIn} accent="#34D399" big />
        <div style={{
          background: "rgba(240,180,41,0.08)", border: "1px solid rgba(240,180,41,0.35)",
          borderRadius: 18, padding: "clamp(14px,1.6vw,26px)", display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          <div style={{ fontSize: "clamp(10px,0.9vw,14px)", letterSpacing: 3, color: "#F0B429", fontWeight: 700, marginBottom: 8 }}>
            {started ? "STATUT" : "DÉBUT DANS"}
          </div>
          {started ? (
            <div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(24px,2.6vw,44px)", fontWeight: 800, color: "#34D399" }}>
              🎓 En cours
            </div>
          ) : (
            <div style={{ display: "flex", gap: "clamp(8px,1vw,16px)", fontVariantNumeric: "tabular-nums" }}>
              {[
                { v: cd.days, l: "J" },
                { v: cd.hours, l: "H" },
                { v: cd.minutes, l: "M" },
                { v: cd.seconds, l: "S" },
              ].map((b) => (
                <div key={b.l} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: "clamp(26px,3.2vw,52px)", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                    {mounted ? pad(b.v) : "--"}
                  </div>
                  <div style={{ fontSize: "clamp(9px,0.8vw,13px)", color: "rgba(245,236,215,0.6)", letterSpacing: 1 }}>{b.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Programme board (airport style) */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ fontSize: "clamp(12px,1.2vw,18px)", letterSpacing: 3, color: "#F0B429", fontWeight: 700 }}>PROGRAMME DU JOUR</div>
          <div style={{ flex: 1, height: 1, background: "rgba(240,180,41,0.25)" }} />
        </div>
        <div style={{
          background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 16,
          overflow: "hidden",
        }}>
          {programmeItems.map((item, i) => {
            const isNow = i === currentIdx;
            const isPast = i < currentIdx;
            const statusLabel = isNow ? "EN COURS" : isPast ? "TERMINÉ" : "À VENIR";
            const statusColor = isNow ? "#F0B429" : isPast ? "#34D399" : "rgba(245,236,215,0.55)";
            return (
              <div key={item.time + item.title} style={{
                display: "grid", gridTemplateColumns: "clamp(64px,7vw,120px) 1fr clamp(88px,10vw,150px)",
                alignItems: "center", gap: "clamp(8px,1.5vw,24px)",
                padding: "clamp(9px,1.15vw,18px) clamp(12px,1.8vw,28px)",
                borderBottom: i < programmeItems.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                background: isNow ? "rgba(240,180,41,0.14)" : "transparent",
                opacity: isPast ? 0.55 : 1,
              }}>
                <div style={{
                  fontFamily: "'Courier New', monospace", fontWeight: 700, color: isNow ? "#F0B429" : "#fff",
                  fontSize: "clamp(16px,1.9vw,32px)", fontVariantNumeric: "tabular-nums", letterSpacing: 1,
                }}>{item.time}</div>
                <div style={{
                  color: isNow ? "#fff" : "rgba(245,236,215,0.9)", fontWeight: isNow ? 800 : 600,
                  fontSize: "clamp(14px,1.6vw,26px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{item.titleFr}</div>
                <div style={{ textAlign: "right" }}>
                  <span style={{
                    display: "inline-block", padding: "clamp(3px,0.4vw,7px) clamp(8px,1vw,16px)", borderRadius: 20,
                    fontSize: "clamp(10px,1vw,15px)", fontWeight: 700, letterSpacing: 1, color: statusColor,
                    border: `1px solid ${isNow ? "rgba(240,180,41,0.6)" : isPast ? "rgba(52,211,153,0.4)" : "rgba(245,236,215,0.25)"}`,
                    background: isNow ? "rgba(240,180,41,0.12)" : "transparent",
                    animation: isNow ? "esenblink 1.6s ease-in-out infinite" : "none",
                  }}>{statusLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes esenblink { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }`}</style>
    </div>
  );
}

function StatTile({ label, value, accent, big }: { label: string; value: number; accent: string; big?: boolean }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 18, padding: "clamp(14px,1.6vw,26px)",
    }}>
      <div style={{ fontSize: "clamp(10px,0.9vw,14px)", letterSpacing: 3, color: accent, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{
        fontFamily: "Georgia, serif", fontWeight: 800, color: "#fff", lineHeight: 1,
        fontSize: big ? "clamp(48px,6vw,104px)" : "clamp(40px,5vw,84px)",
      }}>{value}</div>
    </div>
  );
}
