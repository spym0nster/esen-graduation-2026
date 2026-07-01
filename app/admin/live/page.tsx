"use client";

import { useEffect, useRef, useState } from "react";

interface Stats {
  totalStudents: number;
  totalGuests: number;
  totalExpected: number;
  studentsCheckedIn: number;
  guestsCheckedIn: number;
}

const REFRESH_MS = 3000;

export default function LiveDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [authed, setAuthed] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [pulse, setPulse] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (res.status === 401) { if (alive) setAuthed(false); return; }
        const data: Stats = await res.json();
        if (!alive) return;
        setAuthed(true);
        setStats(data);
        setUpdatedAt(new Date().toLocaleTimeString("fr-TN"));
        setPulse(true);
        setTimeout(() => alive && setPulse(false), 400);
      } catch {}
    };
    load();
    timer.current = setInterval(load, REFRESH_MS);
    return () => { alive = false; if (timer.current) clearInterval(timer.current); };
  }, []);

  const inside = stats ? stats.studentsCheckedIn + stats.guestsCheckedIn : 0;
  const rate = stats && stats.totalExpected > 0
    ? Math.round((inside / stats.totalExpected) * 100)
    : 0;

  const shell: React.CSSProperties = {
    minHeight: "100dvh",
    background: "linear-gradient(135deg, #0A1A4A 0%, #0F2560 55%, #1C0F06 100%)",
    color: "#F5ECD7",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    padding: "clamp(20px, 3vw, 48px)",
    display: "flex",
    flexDirection: "column",
  };

  if (!authed) {
    return (
      <div style={{ ...shell, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Session requise</div>
        <div style={{ color: "rgba(245,236,215,0.7)", marginBottom: 20 }}>
          Connectez-vous d&apos;abord au tableau de bord admin, puis rouvrez cette page.
        </div>
        <a href="/admin" style={{ padding: "12px 24px", borderRadius: 10, background: "#1e2a00", border: "1px solid #F0B429", color: "#F0B429", textDecoration: "none", fontWeight: 600 }}>
          Aller à /admin
        </a>
      </div>
    );
  }

  return (
    <div style={shell}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "clamp(16px, 2.5vw, 40px)", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: "clamp(10px,1vw,13px)", letterSpacing: 5, color: "#F0B429", fontWeight: 700 }}>ESEN · GRADUATION 2026</div>
          <div style={{ fontSize: "clamp(22px,2.6vw,38px)", fontWeight: 800, color: "#fff" }}>Présence en direct</div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: "clamp(11px,1vw,14px)", color: "rgba(245,236,215,0.7)" }}>
          <span style={{
            width: 12, height: 12, borderRadius: "50%",
            background: pulse ? "#34D399" : "#1a7a4a",
            boxShadow: pulse ? "0 0 16px #34D399" : "0 0 6px #1a7a4a",
            transition: "all 0.3s",
          }} />
          EN DIRECT · maj {updatedAt}
        </div>
      </div>

      {/* Hero: people inside */}
      <div style={{
        background: "rgba(240,180,41,0.08)",
        border: "1px solid rgba(240,180,41,0.35)",
        borderRadius: 24,
        padding: "clamp(24px, 4vw, 56px)",
        textAlign: "center",
        marginBottom: "clamp(16px, 2vw, 32px)",
      }}>
        <div style={{ fontSize: "clamp(12px,1.3vw,18px)", letterSpacing: 4, color: "#F0B429", fontWeight: 700, marginBottom: 8 }}>
          PERSONNES À L&apos;INTÉRIEUR
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(72px,16vw,220px)", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
          {inside}
        </div>
        <div style={{ fontSize: "clamp(12px,1.2vw,16px)", color: "rgba(245,236,215,0.6)", marginTop: 8 }}>
          sur {stats?.totalExpected ?? 0} attendus
        </div>
      </div>

      {/* Attendance rate bar */}
      <div style={{ marginBottom: "clamp(16px, 2vw, 32px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: "clamp(12px,1.2vw,16px)", letterSpacing: 2, color: "rgba(245,236,215,0.7)", fontWeight: 600 }}>TAUX DE PRÉSENCE</span>
          <span style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, color: "#34D399" }}>{rate}%</span>
        </div>
        <div style={{ height: 18, background: "rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden" }}>
          <div style={{ width: `${rate}%`, height: "100%", background: "linear-gradient(90deg,#0a7a3c,#34D399)", borderRadius: 20, transition: "width 0.6s ease" }} />
        </div>
      </div>

      {/* Two columns: students + guests */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "clamp(12px,2vw,24px)" }}>
        <LiveCard
          title="DIPLÔMÉS"
          checked={stats?.studentsCheckedIn ?? 0}
          total={stats?.totalStudents ?? 0}
          accent="#60a5fa"
        />
        <LiveCard
          title="ACCOMPAGNATEURS"
          checked={stats?.guestsCheckedIn ?? 0}
          total={stats?.totalGuests ?? 0}
          accent="#c084fc"
        />
      </div>
    </div>
  );
}

function LiveCard({ title, checked, total, accent }: { title: string; checked: number; total: number; accent: string }) {
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 20,
      padding: "clamp(20px, 3vw, 36px)",
    }}>
      <div style={{ fontSize: "clamp(12px,1.2vw,16px)", letterSpacing: 3, color: accent, fontWeight: 700, marginBottom: 12 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontFamily: "Georgia, serif", fontSize: "clamp(48px,8vw,110px)", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{checked}</span>
        <span style={{ fontSize: "clamp(18px,2.5vw,40px)", color: "rgba(245,236,215,0.5)", fontWeight: 600 }}>/ {total}</span>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: accent, borderRadius: 12, transition: "width 0.6s ease" }} />
        </div>
        <div style={{ fontSize: "clamp(11px,1vw,14px)", color: "rgba(245,236,215,0.6)", marginTop: 6 }}>{pct}% enregistrés</div>
      </div>
    </div>
  );
}
