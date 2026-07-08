"use client";

import { useState } from "react";
import { VALID_CLASSES, VALID_SPECIALTIES } from "@/lib/rsvp";

export default function WalkinPage() {
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", classe: "", specialty: "", guestCount: 0 });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const [lastName, setLastName] = useState("");

  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!f.firstName.trim() || !f.lastName.trim()) { setErr("Prénom et nom obligatoires."); return; }
    setStatus("loading");
    try {
      const res = await fetch("/api/scanner/walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "fail");
      setLastName(`${f.firstName} ${f.lastName}`);
      setStatus("done");
      setF({ firstName: "", lastName: "", email: "", phone: "", classe: "", specialty: "", guestCount: 0 });
    } catch {
      setStatus("error");
      setErr("Échec de l'admission. Réessaie.");
    }
  };

  const label: React.CSSProperties = { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#F0B429", marginBottom: 6, display: "block" };
  const input: React.CSSProperties = { width: "100%", padding: "13px 14px", borderRadius: 10, boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(240,180,41,0.3)", color: "#F5ECD7", fontSize: 15, outline: "none" };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0A1A4A 0%, #0F2560 50%, #1C0F06 100%)",
      color: "#F5ECD7", fontFamily: "Arial, Helvetica, sans-serif",
      padding: "max(20px, env(safe-area-inset-top)) 16px 40px",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, color: "#fff", fontSize: 22, letterSpacing: 5 }}>ESEN</div>
          <div style={{ color: "#F0B429", fontSize: 9, letterSpacing: 3, marginTop: 5 }}>GRADUATION 2026</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#fff", fontSize: "clamp(24px,4vw,38px)", fontWeight: 800, marginTop: 12 }}>
            Nouvel arrivant
          </h1>
          <p style={{ color: "rgba(245,236,215,0.7)", fontSize: 14, marginTop: 6 }}>
            Admission sur place (sans inscription préalable).
          </p>
          <div style={{ width: 60, height: 2, background: "linear-gradient(90deg,#1B3A8C,#F0B429,#1B3A8C)", margin: "12px auto 0" }} />
        </div>

        {status === "done" ? (
          <div style={{ textAlign: "center", background: "linear-gradient(135deg,#0c4a2b,#0a7a3c)", border: "2px solid rgba(52,211,153,0.6)", borderRadius: 16, padding: 40 }}>
            <div style={{ fontSize: 56 }}>✓</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginTop: 8 }}>ENTRÉE AUTORISÉE</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 10 }}>{lastName}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>Admis en Walk-in ✓</div>
            <button onClick={() => setStatus("idle")} style={{ marginTop: 22, padding: "13px 26px", borderRadius: 10, background: "#1B3A8C", border: "1px solid #F0B429", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              ＋ Admettre une autre personne
            </button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(240,180,41,0.25)", borderRadius: 16, padding: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={label}>Prénom *</label><input style={input} value={f.firstName} onChange={(e) => set("firstName", e.target.value)} /></div>
            <div><label style={label}>Nom *</label><input style={input} value={f.lastName} onChange={(e) => set("lastName", e.target.value)} /></div>
            <div><label style={label}>E-mail</label><input type="email" style={input} value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div><label style={label}>Téléphone</label><input type="tel" style={input} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div>
              <label style={label}>Classe</label>
              <select style={input} value={f.classe} onChange={(e) => set("classe", e.target.value)}>
                <option value="">—</option>
                {VALID_CLASSES.map((c) => <option key={c} value={c} style={{ background: "#0F2560" }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Spécialité</label>
              <select style={input} value={f.specialty} onChange={(e) => set("specialty", e.target.value)}>
                <option value="">—</option>
                {VALID_SPECIALTIES.map((s) => <option key={s} value={s} style={{ background: "#0F2560" }}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={label}>Nombre d&apos;invités</label>
              <select style={input} value={f.guestCount} onChange={(e) => set("guestCount", Number(e.target.value))}>
                {[0, 1, 2, 3].map((n) => <option key={n} value={n} style={{ background: "#0F2560" }}>{n}</option>)}
              </select>
            </div>

            {err && <div style={{ gridColumn: "1 / -1", color: "#F87171", fontSize: 13 }}>{err}</div>}

            <button type="submit" disabled={status === "loading"} style={{ gridColumn: "1 / -1", padding: "15px 0", borderRadius: 12, background: "linear-gradient(135deg,#0c4a2b,#0a7a3c)", border: "1px solid rgba(52,211,153,0.7)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: status === "loading" ? "wait" : "pointer" }}>
              {status === "loading" ? "Admission…" : "✓ Admettre l'entrée"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
