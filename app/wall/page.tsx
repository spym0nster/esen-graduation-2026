"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface MediaItem { id: string; url: string; caption: string; author: string; createdAt: string }

const POLL_MS = 6000;

export default function WallPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [author, setAuthor] = useState("");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/media?type=wall", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const pick = (f: File | null) => {
    setFile(f);
    setErr("");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  const submit = async () => {
    if (!file) { setErr("Choisis une photo."); return; }
    if (!file.type.startsWith("image/")) { setErr("Le fichier doit être une image."); return; }
    if (file.size > 10 * 1024 * 1024) { setErr("Image trop lourde (max 10 Mo)."); return; }
    setStatus("uploading");
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "wall");
      fd.append("author", author);
      fd.append("caption", caption);
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      setStatus("done");
      setFile(null); setCaption("");
      if (preview) { URL.revokeObjectURL(preview); setPreview(""); }
      if (fileRef.current) fileRef.current.value = "";
      load();
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setErr("Échec de l'envoi. Réessaie.");
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0A1A4A 0%, #0F2560 50%, #1C0F06 100%)",
      color: "#F5ECD7",
      fontFamily: "Arial, Helvetica, sans-serif",
      padding: "max(20px, env(safe-area-inset-top)) 16px 40px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, color: "#fff", fontSize: 22, letterSpacing: 5 }}>ESEN</div>
        <div style={{ color: "#F0B429", fontSize: 9, letterSpacing: 3, marginTop: 5 }}>GRADUATION 2026</div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#fff", fontSize: "clamp(26px,4vw,44px)", fontWeight: 800, marginTop: 12 }}>
          Mur des souvenirs
        </h1>
        <p style={{ color: "rgba(245,236,215,0.7)", fontSize: 14, marginTop: 6 }}>
          Partage une photo — elle apparaît sur le mur en direct.
        </p>
        <div style={{ width: 60, height: 2, background: "linear-gradient(90deg,#1B3A8C,#F0B429,#1B3A8C)", margin: "12px auto 0" }} />
      </div>

      {/* Upload card */}
      <div style={{
        maxWidth: 520, margin: "0 auto 32px", background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(240,180,41,0.3)", borderRadius: 16, padding: 20,
      }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => pick(e.target.files?.[0] || null)}
          style={{ display: "none" }}
          id="wallfile"
        />
        <label htmlFor="wallfile" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          height: preview ? "auto" : 140, borderRadius: 12, cursor: "pointer",
          border: "2px dashed rgba(240,180,41,0.4)", background: "rgba(255,255,255,0.03)",
          color: "#F0B429", fontSize: 15, fontWeight: 700, overflow: "hidden", padding: preview ? 8 : 0,
        }}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="aperçu" style={{ maxHeight: 260, width: "100%", objectFit: "contain", borderRadius: 8 }} />
          ) : (
            <span>📷 Choisir / prendre une photo</span>
          )}
        </label>

        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Ton nom (optionnel)"
          style={inputStyle}
          maxLength={80}
        />
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Un message / souvenir (optionnel)"
          style={inputStyle}
          maxLength={200}
        />

        {err && <div style={{ color: "#F87171", fontSize: 13, marginTop: 10 }}>{err}</div>}

        <button
          onClick={submit}
          disabled={status === "uploading"}
          style={{
            width: "100%", marginTop: 14, padding: "14px 0", borderRadius: 12,
            background: status === "done" ? "linear-gradient(135deg,#0c4a2b,#0a7a3c)" : "linear-gradient(135deg,#1B3A8C,#0F2560)",
            border: "1px solid #F0B429", color: "#fff", fontSize: 16, fontWeight: 700,
            cursor: status === "uploading" ? "wait" : "pointer",
          }}
        >
          {status === "uploading" ? "Envoi en cours…" : status === "done" ? "✓ Publié !" : "Publier sur le mur"}
        </button>
      </div>

      {/* Live wall */}
      {items.length === 0 ? (
        <div style={{ textAlign: "center", color: "rgba(245,236,215,0.5)", fontSize: 14, padding: 30 }}>
          Aucun souvenir pour l&apos;instant — sois le premier ✨
        </div>
      ) : (
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          columns: "clamp(160px, 30vw, 260px)", columnGap: 14,
        }}>
          {items.map((m) => (
            <div key={m.id} style={{
              breakInside: "avoid", marginBottom: 14, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.caption || "souvenir"} loading="lazy" style={{ width: "100%", display: "block" }} />
              {(m.caption || m.author) && (
                <div style={{ padding: "10px 12px" }}>
                  {m.caption && <div style={{ fontSize: 14, color: "#fff", lineHeight: 1.35 }}>{m.caption}</div>}
                  {m.author && <div style={{ fontSize: 12, color: "#F0B429", marginTop: 4 }}>— {m.author}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", marginTop: 12, padding: "12px 14px", borderRadius: 10, boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(240,180,41,0.3)",
  color: "#F5ECD7", fontSize: 15, outline: "none",
};
