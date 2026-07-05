"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { useCountUp } from "@/components/ui/useCountUp";
import { useCelebrate } from "@/components/ui/useCelebrate";
import { fireConfetti } from "@/lib/celebrate";

Chart.register(...registerables);

interface Student { id: string; classe: string; specialty: string; guestCount: number; scanned: boolean; emailStatus: string; voided?: boolean }
interface Guest { id: string; parentId: string; scanned: boolean; voided?: boolean }

const CORDER = ["L1", "L2", "L3", "M1", "M2", "Autre", "Professeur", "Administration"];
const REFRESH_MS = 8000;

export default function JourJPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [authed, setAuthed] = useState(true);
  const [selC, setSelC] = useState<Set<string>>(new Set());
  const [selS, setSelS] = useState<Set<string>>(new Set());
  const [auto, setAuto] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");
  const [pulse, setPulse] = useState(false);
  const charts = useRef<Record<string, Chart>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/attendees", { cache: "no-store" });
      if (res.status === 401) { setAuthed(false); return; }
      const data = await res.json();
      setAuthed(true);
      setStudents((data.students || []).filter((s: Student) => !s.voided));
      setGuests((data.guests || []).filter((g: Guest) => !g.voided));
      setUpdatedAt(new Date().toLocaleTimeString("fr-TN"));
      setPulse(true); setTimeout(() => setPulse(false), 400);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [auto, load]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key.toLowerCase() === "c") fireConfetti(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const classes = CORDER.filter((c) => students.some((s) => s.classe === c))
    .concat(Array.from(new Set(students.map((s) => s.classe))).filter((c) => c && CORDER.indexOf(c) < 0));
  const specs = Array.from(new Set(students.map((s) => s.specialty).filter(Boolean))).sort();

  const toggle = (set: Set<string>, v: string, setter: (s: Set<string>) => void) => {
    const n = new Set(set); if (n.has(v)) n.delete(v); else n.add(v); setter(n);
  };

  // filtered sets
  const fs = students.filter((s) => (selC.size === 0 || selC.has(s.classe)) && (selS.size === 0 || selS.has(s.specialty)));
  const fsIds = new Set(fs.map((s) => s.id));
  const fg = guests.filter((g) => fsIds.has(g.parentId));
  const studentsIn = fs.filter((s) => s.scanned).length;
  const guestsIn = fg.filter((g) => g.scanned).length;
  const inside = studentsIn + guestsIn;
  const totalExpected = fs.length + fg.length;
  const rate = totalExpected > 0 ? Math.round((inside / totalExpected) * 100) : 0;
  const walkins = fs.filter((s) => s.emailStatus === "Walk-in").length;

  const full = totalExpected > 0 && inside >= totalExpected;
  const banner = useCelebrate(inside, full);
  const insideA = useCountUp(inside);
  const rateA = useCountUp(rate);
  const stInA = useCountUp(studentsIn);
  const guInA = useCountUp(guestsIn);
  const wkA = useCountUp(walkins);

  // charts
  useEffect(() => {
    const isDark = matchMedia("(prefers-color-scheme: dark)").matches;
    const grid = isDark ? "#2c2c2a" : "#e1e0d9";
    const surface = "#111827";
    Chart.defaults.color = "#9ca3af";

    const totByClasse = classes.map((c) => fs.filter((s) => s.classe === c).length);
    const inByClasse = classes.map((c) => fs.filter((s) => s.classe === c && s.scanned).length);
    const inBySpec = specs.map((sp) => fs.filter((s) => s.specialty === sp && s.scanned).length);

    const upsert = (id: string, cfg: () => import("chart.js").ChartConfiguration, upd: (c: Chart) => void) => {
      if (charts.current[id]) { upd(charts.current[id]); charts.current[id].update(); }
      else { const el = document.getElementById(id) as HTMLCanvasElement | null; if (el) charts.current[id] = new Chart(el, cfg()); }
    };

    upsert("jClasse",
      () => ({ type: "bar", data: { labels: classes, datasets: [
        { label: "Inscrits", data: totByClasse, backgroundColor: "#1e3a5f", borderRadius: 4, maxBarThickness: 34 },
        { label: "Entrés", data: inByClasse, backgroundColor: "#34D399", borderRadius: 4, maxBarThickness: 34 },
      ] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } }, scales: { y: { beginAtZero: true, grid: { color: grid }, ticks: { precision: 0 } }, x: { grid: { display: false } } } } }),
      (c) => { c.data.labels = classes; c.data.datasets[0].data = totByClasse; c.data.datasets[1].data = inByClasse; });

    upsert("jSpec",
      () => ({ type: "bar", data: { labels: specs, datasets: [{ label: "Entrés", data: inBySpec, backgroundColor: "#34D399", borderRadius: 4, maxBarThickness: 20 }] }, options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { color: grid }, ticks: { precision: 0 } }, y: { grid: { display: false } } } } }),
      (c) => { c.data.labels = specs; c.data.datasets[0].data = inBySpec; });

    upsert("jType",
      () => ({ type: "doughnut", data: { labels: ["Diplômés", "Invités"], datasets: [{ data: [studentsIn, guestsIn], backgroundColor: ["#60a5fa", "#c084fc"], borderWidth: 2, borderColor: surface }] }, options: { responsive: true, maintainAspectRatio: false, cutout: "58%", plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } } } }),
      (c) => { c.data.datasets[0].data = [studentsIn, guestsIn]; });

    upsert("jProg",
      () => ({ type: "doughnut", data: { labels: ["Entrés", "Pas encore"], datasets: [{ data: [inside, Math.max(0, totalExpected - inside)], backgroundColor: ["#34D399", isDark ? "#383835" : "#e1e0d9"], borderWidth: 2, borderColor: surface }] }, options: { responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } } } }),
      (c) => { c.data.datasets[0].data = [inside, Math.max(0, totalExpected - inside)]; });
  }, [students, guests, selC, selS, classes, specs, studentsIn, guestsIn, inside, totalExpected]);

  useEffect(() => () => { Object.values(charts.current).forEach((c) => c.destroy()); charts.current = {}; }, []);

  if (!authed) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0a0f1e", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", gap: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Session requise</div>
        <a href="/admin" style={{ padding: "10px 22px", borderRadius: 8, background: "#1e2a00", border: "1px solid #F0B429", color: "#F0B429", textDecoration: "none", fontWeight: 600 }}>Aller à /admin</a>
      </div>
    );
  }

  const kpis = [
    { label: "À L'INTÉRIEUR", value: insideA, sub: `sur ${totalExpected}`, color: "#34D399", big: true },
    { label: "TAUX DE PRÉSENCE", value: `${rateA}%`, sub: "", color: "#F0B429", big: true },
    { label: "DIPLÔMÉS ENTRÉS", value: stInA, sub: `sur ${fs.length}`, color: "#60a5fa" },
    { label: "INVITÉS ENTRÉS", value: guInA, sub: `sur ${fg.length}`, color: "#c084fc" },
    { label: "WALK-INS", value: wkA, sub: "sur place", color: "#fb923c" },
  ];

  const chip = (v: string, active: boolean, onClick: () => void) => (
    <button key={v} onClick={onClick} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 16, cursor: "pointer", background: active ? "#1B3A8C" : "#111827", border: `1px solid ${active ? "#F0B429" : "#1e3a5f"}`, color: active ? "#fff" : "#9ca3af" }}>{v}</button>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0f1e", color: "#fff", fontFamily: "'Inter','Segoe UI',sans-serif", padding: "clamp(16px,2.5vw,28px)" }}>
      <style>{`@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}@keyframes celebPop{0%{transform:translateX(-50%) scale(0.6);opacity:0}55%{transform:translateX(-50%) scale(1.08);opacity:1}100%{transform:translateX(-50%) scale(1);opacity:1}}`}</style>
      {banner && (
        <div style={{ position: "fixed", top: "10%", left: "50%", transform: "translateX(-50%)", zIndex: 100000, background: "linear-gradient(135deg,#F0B429,#FFD166)", color: "#0A1A4A", padding: "16px 34px", borderRadius: 16, fontSize: "clamp(18px,3vw,34px)", fontWeight: 800, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", animation: "celebPop 0.5s ease", whiteSpace: "nowrap" }}>{banner}</div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#F0B429", fontWeight: 700 }}>ESEN · GRADUATION 2026</div>
          <div style={{ fontSize: "clamp(20px,2.4vw,32px)", fontWeight: 800 }}>Centre de contrôle — Jour J</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9ca3af" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: pulse ? "#34D399" : "#1a7a4a", boxShadow: pulse ? "0 0 12px #34D399" : "none", transition: "all .3s" }} />
            maj {updatedAt}
          </span>
          <button onClick={() => setAuto((v) => !v)} style={{ padding: "8px 14px", borderRadius: 8, background: auto ? "#052e16" : "#1f2937", border: `1px solid ${auto ? "#16a34a" : "#374151"}`, color: auto ? "#4ade80" : "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{auto ? "● Live" : "○ Live"}</button>
          <button onClick={load} style={{ padding: "8px 14px", borderRadius: 8, background: "#1B3A8C", border: "1px solid #F0B429", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>↺</button>
          <a href="/admin" style={{ padding: "8px 14px", borderRadius: 8, background: "#1f2937", border: "1px solid #374151", color: "#9ca3af", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← Admin</a>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: "#111827", border: "1px solid #1e3a5f", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: 1 }}>{k.label}</div>
            <div style={{ fontFamily: "Georgia,serif", fontWeight: 800, color: k.color, lineHeight: 1.05, marginTop: 4, fontSize: k.big ? "clamp(36px,4.5vw,60px)" : "clamp(30px,3.5vw,44px)", animation: k.big ? "breathe 3.6s ease-in-out infinite" : undefined, transformOrigin: "left center" }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: 1, marginBottom: 6 }}>FILTRE — CLASSE</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>{classes.map((c) => chip(c, selC.has(c), () => toggle(selC, c, setSelC)))}</div>
      <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: 1, marginBottom: 6 }}>FILTRE — SPÉCIALITÉ</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>{specs.map((s) => chip(s, selS.has(s), () => toggle(selS, s, setSelS)))}</div>
      {(selC.size > 0 || selS.size > 0) && (
        <button onClick={() => { setSelC(new Set()); setSelS(new Set()); }} style={{ marginBottom: 18, fontSize: 12, background: "none", border: "1px solid #374151", color: "#9ca3af", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>↺ Réinitialiser</button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18, marginTop: 8 }}>
        <Card title="Présence par classe (inscrits vs entrés)"><canvas id="jClasse" role="img" aria-label="Présence par classe" /></Card>
        <Card title="Entrés par spécialité"><canvas id="jSpec" role="img" aria-label="Entrés par spécialité" /></Card>
        <Card title="Diplômés vs invités (entrés)"><canvas id="jType" role="img" aria-label="Diplômés vs invités entrés" /></Card>
        <Card title="Progression du check-in"><canvas id="jProg" role="img" aria-label="Progression du check-in" /></Card>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: "#6b7280" }}>Astuce : appuie sur « C » pour lancer des confettis · palier festif toutes les 50 entrées.</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#111827", border: "1px solid #1e3a5f", borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 10 }}>{title}</div>
      <div style={{ position: "relative", height: 240 }}>{children}</div>
    </div>
  );
}
