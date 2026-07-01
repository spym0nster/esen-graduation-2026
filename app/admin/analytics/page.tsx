"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface Student {
  id: string;
  classe: string;
  specialty: string;
  guestCount: number;
  scanned: boolean;
  registeredAt: string;
}
interface Guest { id: string; parentId: string; scanned: boolean }

const CORDER = ["L1", "L2", "L3", "M1", "M2"];
const REFRESH_MS = 15000;

export default function AnalyticsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [authed, setAuthed] = useState(true);
  const [selC, setSelC] = useState<Set<string>>(new Set());
  const [selS, setSelS] = useState<Set<string>>(new Set());
  const [auto, setAuto] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");

  const charts = useRef<Record<string, Chart>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/attendees", { cache: "no-store" });
      if (res.status === 401) { setAuthed(false); return; }
      const data = await res.json();
      setAuthed(true);
      setStudents(data.students || []);
      setGuests(data.guests || []);
      setUpdatedAt(new Date().toLocaleTimeString("fr-TN"));
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [auto, load]);

  // Fixed label sets from full data
  const classes = CORDER.filter((c) => students.some((s) => s.classe === c))
    .concat(Array.from(new Set(students.map((s) => s.classe))).filter((c) => c && CORDER.indexOf(c) < 0));
  const specs = Array.from(new Set(students.map((s) => s.specialty).filter(Boolean))).sort();
  const days = Array.from(new Set(students.map((s) => (s.registeredAt || "").slice(0, 10)).filter(Boolean))).sort();

  const toggle = (set: Set<string>, v: string, setter: (s: Set<string>) => void) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v); else n.add(v);
    setter(n);
  };

  // Render / update charts whenever data or filters change
  useEffect(() => {
    const fs = students.filter((s) => (selC.size === 0 || selC.has(s.classe)) && (selS.size === 0 || selS.has(s.specialty)));
    const ids = new Set(fs.map((s) => s.id));
    const fg = guests.filter((g) => ids.has(g.parentId));

    const isDark = matchMedia("(prefers-color-scheme: dark)").matches;
    const grid = isDark ? "#2c2c2a" : "#e1e0d9";
    const ink = "#898781";
    Chart.defaults.color = ink;

    const countBy = (arr: Student[], key: "classe" | "specialty", labels: string[]) =>
      labels.map((l) => arr.filter((r) => r[key] === l).length);
    const dayCounts = days.map((d) => fs.filter((s) => (s.registeredAt || "").slice(0, 10) === d).length);
    const guestDist = [0, 1, 2, 3].map((n) => fs.filter((s) => s.guestCount === n).length);
    const checkedStudents = fs.filter((s) => s.scanned).length;
    const checkedGuests = fg.filter((g) => g.scanned).length;
    const totalExpected = fs.length + fg.length;
    const inside = checkedStudents + checkedGuests;

    const surface = isDark ? "#1a1a19" : "#ffffff";

    const upsert = (id: string, cfg: () => import("chart.js").ChartConfiguration, update: (c: Chart) => void) => {
      if (charts.current[id]) { update(charts.current[id]); charts.current[id].update(); }
      else {
        const el = document.getElementById(id) as HTMLCanvasElement | null;
        if (el) charts.current[id] = new Chart(el, cfg());
      }
    };

    upsert("aClasse",
      () => ({ type: "bar", data: { labels: classes, datasets: [{ data: countBy(fs, "classe", classes), backgroundColor: "#2a78d6", borderRadius: 4, maxBarThickness: 46 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: grid }, ticks: { precision: 0 } }, x: { grid: { display: false } } } } }),
      (c) => { c.data.labels = classes; c.data.datasets[0].data = countBy(fs, "classe", classes); });
    upsert("aSpec",
      () => ({ type: "bar", data: { labels: specs, datasets: [{ data: countBy(fs, "specialty", specs), backgroundColor: "#1baf7a", borderRadius: 4, maxBarThickness: 22 }] }, options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { color: grid }, ticks: { precision: 0 } }, y: { grid: { display: false } } } } }),
      (c) => { c.data.labels = specs; c.data.datasets[0].data = countBy(fs, "specialty", specs); });
    upsert("aGuests",
      () => ({ type: "doughnut", data: { labels: ["0 invité", "1 invité", "2 invités", "3 invités"], datasets: [{ data: guestDist, backgroundColor: ["#888780", "#eda100", "#4a3aa7", "#2a78d6"], borderWidth: 2, borderColor: surface }] }, options: { responsive: true, maintainAspectRatio: false, cutout: "58%", plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } } } }),
      (c) => { c.data.datasets[0].data = guestDist; });
    upsert("aDay",
      () => ({ type: "bar", data: { labels: days, datasets: [{ data: dayCounts, backgroundColor: "#eda100", borderRadius: 4, maxBarThickness: 60 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: grid }, ticks: { precision: 0 } }, x: { grid: { display: false } } } } }),
      (c) => { c.data.labels = days; c.data.datasets[0].data = dayCounts; });
    upsert("aCheck",
      () => ({ type: "doughnut", data: { labels: ["Entrés", "Pas encore"], datasets: [{ data: [inside, Math.max(0, totalExpected - inside)], backgroundColor: ["#1baf7a", isDark ? "#383835" : "#e1e0d9"], borderWidth: 2, borderColor: surface }] }, options: { responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } } } }),
      (c) => { c.data.datasets[0].data = [inside, Math.max(0, totalExpected - inside)]; });
  }, [students, guests, selC, selS, classes, specs, days]);

  // Destroy on unmount
  useEffect(() => () => { Object.values(charts.current).forEach((c) => c.destroy()); charts.current = {}; }, []);

  const fs = students.filter((s) => (selC.size === 0 || selC.has(s.classe)) && (selS.size === 0 || selS.has(s.specialty)));
  const ids = new Set(fs.map((s) => s.id));
  const fg = guests.filter((g) => ids.has(g.parentId));
  const guestsN = fg.length;
  const inside = fs.filter((s) => s.scanned).length + fg.filter((g) => g.scanned).length;
  const totalExpected = fs.length + guestsN;
  const rate = totalExpected > 0 ? Math.round((inside / totalExpected) * 100) : 0;
  const avgGuests = fs.length ? (guestsN / fs.length).toFixed(1) : "0";

  if (!authed) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0a0f1e", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", gap: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Session requise</div>
        <div style={{ color: "#9ca3af" }}>Connecte-toi au tableau de bord admin, puis rouvre cette page.</div>
        <a href="/admin" style={{ padding: "10px 22px", borderRadius: 8, background: "#1e2a00", border: "1px solid #F0B429", color: "#F0B429", textDecoration: "none", fontWeight: 600 }}>Aller à /admin</a>
      </div>
    );
  }

  const kpis = [
    { label: "Étudiants", value: fs.length, color: "#60a5fa" },
    { label: "Accompagnateurs", value: guestsN, color: "#c084fc" },
    { label: "Total attendu", value: totalExpected, color: "#F0B429" },
    { label: "Moy. invités", value: avgGuests, color: "#34D399" },
    { label: "Taux de présence", value: rate + "%", color: "#34D399" },
  ];

  const chip = (v: string, active: boolean, onClick: () => void) => (
    <button key={v} onClick={onClick} style={{
      fontSize: 12, padding: "5px 12px", borderRadius: 16, cursor: "pointer",
      background: active ? "#1B3A8C" : "#111827", border: `1px solid ${active ? "#F0B429" : "#1e3a5f"}`,
      color: active ? "#fff" : "#9ca3af",
    }}>{v}</button>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0f1e", color: "#fff", fontFamily: "'Inter','Segoe UI',sans-serif", padding: "24px 28px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#F0B429", fontWeight: 600 }}>ESEN · GRADUATION 2026</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Analytics — inscriptions</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>maj {updatedAt}</span>
          <button onClick={() => setAuto((v) => !v)} style={{ padding: "8px 14px", borderRadius: 8, background: auto ? "#052e16" : "#1f2937", border: `1px solid ${auto ? "#16a34a" : "#374151"}`, color: auto ? "#4ade80" : "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{auto ? "● Live" : "○ Live"}</button>
          <button onClick={load} style={{ padding: "8px 14px", borderRadius: 8, background: "#1B3A8C", border: "1px solid #F0B429", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>↺</button>
          <a href="/admin" style={{ padding: "8px 14px", borderRadius: 8, background: "#1f2937", border: "1px solid #374151", color: "#9ca3af", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← Admin</a>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 20 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: "#111827", border: "1px solid #1e3a5f", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: 1, textTransform: "uppercase" }}>{k.label}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: k.color, marginTop: 4 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: 1, marginBottom: 6 }}>FILTRE — CLASSE</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {classes.map((c) => chip(c, selC.has(c), () => toggle(selC, c, setSelC)))}
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: 1, marginBottom: 6 }}>FILTRE — SPÉCIALITÉ</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {specs.map((s) => chip(s, selS.has(s), () => toggle(selS, s, setSelS)))}
      </div>
      {(selC.size > 0 || selS.size > 0) && (
        <button onClick={() => { setSelC(new Set()); setSelS(new Set()); }} style={{ marginBottom: 18, fontSize: 12, background: "none", border: "1px solid #374151", color: "#9ca3af", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>↺ Réinitialiser les filtres</button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18, marginTop: 8 }}>
        <Card title="Inscrits par classe"><canvas id="aClasse" role="img" aria-label="Inscrits par classe" /></Card>
        <Card title="Inscrits par spécialité"><canvas id="aSpec" role="img" aria-label="Inscrits par spécialité" /></Card>
        <Card title="Invités par étudiant"><canvas id="aGuests" role="img" aria-label="Invités par étudiant" /></Card>
        <Card title="Inscriptions par jour"><canvas id="aDay" role="img" aria-label="Inscriptions par jour" /></Card>
        <Card title="Check-in (présence)"><canvas id="aCheck" role="img" aria-label="Check-in présence" /></Card>
      </div>
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
