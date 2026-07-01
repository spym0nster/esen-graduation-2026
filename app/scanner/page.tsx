"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

type ScanResult = {
  status: string;
  name?: string;
  type?: string;
  scannedAt?: string;
};

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const RESET_MS = 1400; // how long a result stays before auto-resuming

export default function ScannerPage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(true);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockRef = useRef<any>(null);

  const vibrate = (pattern: number | number[]) => {
    try { navigator.vibrate?.(pattern); } catch {}
  };

  // Resume scanning immediately (used by the auto-timer and by tapping a result).
  const resume = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = null;
    setResult(null);
    scanningRef.current = true;
  }, []);

  useEffect(() => {
    const scanner = new Html5Qrcode("reader", { verbose: false });
    scannerRef.current = scanner;

    // Keep the screen awake during check-in and re-acquire after tab switches.
    const requestWakeLock = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wakeLockRef.current = await (navigator as any).wakeLock?.request("screen");
      } catch {}
    };
    requestWakeLock();
    const onVisible = () => { if (document.visibilityState === "visible") requestWakeLock(); };
    document.addEventListener("visibilitychange", onVisible);

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 12,
          // Scan box sized to the viewport so it works on any phone.
          qrbox: (w: number, h: number) => {
            const size = Math.round(Math.min(w, h) * 0.8);
            return { width: size, height: size };
          },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (!scanningRef.current) return;
          scanningRef.current = false;

          const match = decodedText.match(UUID_RE);
          const id = match ? match[0] : decodedText;

          try {
            const res = await fetch("/api/scanner/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id }),
            });
            const data: ScanResult = await res.json();
            setResult(data);
            if (data.status === "success") vibrate(120);
            else if (data.status === "already_scanned") vibrate([60, 50, 60]);
            else vibrate([200, 80, 200]);
          } catch {
            setResult({ status: "error" });
            vibrate([200, 80, 200]);
          }

          resetTimer.current = setTimeout(resume, RESET_MS);
        },
        () => {}
      )
      .catch((err) => {
        console.error("Camera start failed:", err);
        setResult({ status: "camera_error" });
      });

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      try { wakeLockRef.current?.release?.(); } catch {}
      scanner.stop().catch(() => {});
    };
  }, [resume]);

  const ok = result?.status === "success";
  const already = result?.status === "already_scanned";
  const cameraError = result?.status === "camera_error";

  const state = ok
    ? { Icon: CheckCircle, color: "#34D399", label: "ENTRÉE AUTORISÉE", bg: "linear-gradient(135deg,#0c4a2b,#0a7a3c)", border: "rgba(52,211,153,0.6)" }
    : already
    ? { Icon: AlertTriangle, color: "#F0B429", label: "DÉJÀ SCANNÉ", bg: "linear-gradient(135deg,#5a4410,#7a5c0f)", border: "rgba(240,180,41,0.6)" }
    : { Icon: XCircle, color: "#F87171", label: "CODE INVALIDE", bg: "linear-gradient(135deg,#5a1414,#7a0f0f)", border: "rgba(248,113,113,0.6)" };

  const corner = (v: "top" | "bottom", h: "left" | "right"): React.CSSProperties => {
    const s: React.CSSProperties = {
      position: "absolute",
      width: 30,
      height: 30,
      borderColor: "#F0B429",
      borderStyle: "solid",
      borderRadius: 4,
      pointerEvents: "none",
      borderTopWidth: v === "top" ? 3 : 0,
      borderBottomWidth: v === "bottom" ? 3 : 0,
      borderLeftWidth: h === "left" ? 3 : 0,
      borderRightWidth: h === "right" ? 3 : 0,
    };
    if (v === "top") s.top = 14; else s.bottom = 14;
    if (h === "left") s.left = 14; else s.right = 14;
    return s;
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #0A1A4A 0%, #0F2560 50%, #1C0F06 100%)",
        color: "#F5ECD7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "max(20px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom))",
        fontFamily: "Arial, Helvetica, sans-serif",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      {/* Header (compact on phones) */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, color: "#FFFFFF", fontSize: 22, letterSpacing: 5 }}>ESEN</div>
        <div style={{ color: "#F0B429", fontSize: 9, letterSpacing: 3, marginTop: 5 }}>GRADUATION 2026</div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#FFFFFF", fontSize: 19, fontWeight: 700, marginTop: 12 }}>
          Scanner d&apos;entrée
        </h1>
        <div style={{ width: 56, height: 2, background: "linear-gradient(90deg,#1B3A8C,#F0B429,#1B3A8C)", margin: "10px auto 0" }} />
      </div>

      {/* Camera frame — tap to scan the next person immediately */}
      <div
        onClick={() => { if (result) resume(); }}
        className="relative w-full"
        style={{
          maxWidth: "min(96vw, 540px)",
          aspectRatio: "1 / 1",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(240,180,41,0.35)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          background: "#06102e",
          cursor: result ? "pointer" : "default",
        }}
      >
        <div id="reader" style={{ width: "100%", height: "100%" }} />

        <div style={corner("top", "left")} />
        <div style={corner("top", "right")} />
        <div style={corner("bottom", "left")} />
        <div style={corner("bottom", "right")} />

        {!result && (
          <div
            className="scan-line"
            style={{
              position: "absolute",
              left: "8%",
              right: "8%",
              height: 2,
              background: "linear-gradient(90deg, transparent, #F0B429, transparent)",
              boxShadow: "0 0 12px rgba(240,180,41,0.8)",
              pointerEvents: "none",
            }}
          />
        )}

        {result && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: 24,
              background: cameraError ? "linear-gradient(135deg,#3a1414,#5a0f0f)" : state.bg,
              border: `2px solid ${cameraError ? "rgba(248,113,113,0.6)" : state.border}`,
            }}
          >
            {cameraError ? (
              <>
                <XCircle size={64} color="#F87171" style={{ marginBottom: 14 }} />
                <div style={{ fontSize: 18, fontWeight: 800, color: "#FFF" }}>CAMÉRA INDISPONIBLE</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 10 }}>
                  Autorisez la caméra puis rechargez la page.
                </div>
              </>
            ) : (
              <>
                <state.Icon size={72} color={state.color} style={{ marginBottom: 14 }} />
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: "#FFFFFF" }}>{state.label}</div>
                {result.name && <div style={{ fontSize: 21, fontWeight: 700, color: "#FFFFFF", marginTop: 12, lineHeight: 1.25 }}>{result.name}</div>}
                {result.type && <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>{result.type}</div>}
                {already && result.scannedAt && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 10 }}>
                    Premier scan : {new Date(result.scannedAt).toLocaleString()}
                  </div>
                )}
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 16, letterSpacing: 1 }}>
                  Touchez pour continuer
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Status hint */}
      <div style={{ marginTop: 20, textAlign: "center", minHeight: 20 }}>
        {!result ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#F0B429", fontSize: 13, letterSpacing: 1 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px #34D399", display: "inline-block" }} />
            Placez le QR code dans le cadre
          </div>
        ) : (
          <div style={{ color: "rgba(245,236,215,0.6)", fontSize: 12 }}>Prêt pour le suivant…</div>
        )}
      </div>

      {/* ESEN Ambassadors logo */}
      <a
        href="https://www.instagram.com/esen.ambassadors/"
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginTop: "auto", paddingTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textDecoration: "none" }}
      >
        <div style={{ background: "#fff", borderRadius: 16, padding: 9, boxShadow: "0 0 24px rgba(27,58,140,0.25)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logos/ambassadors.png"
            alt="ESEN Ambassadors"
            width={48}
            height={48}
            style={{ display: "block", width: 48, height: 48, objectFit: "contain" }}
          />
        </div>
        <span style={{ color: "rgba(240,180,41,0.55)", fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>ESEN Ambassadors</span>
      </a>
    </div>
  );
}
