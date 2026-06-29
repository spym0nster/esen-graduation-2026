"use client";

import { useEffect, useRef, useState } from "react";

type ScanStatus = "scanning" | "authorized" | "already_scanned" | "invalid" | "loading";

interface ScanResult {
  status: "authorized" | "already_scanned" | "invalid";
  type?: string;
  name?: string;
  classe?: string;
  specialty?: string;
  scannedAt?: string | null;
}

export default function ScannerPage() {
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("scanning");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const processingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startScanner = async () => {
    if (!containerRef.current) return;
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    await scanner.start(
      { facingMode: "environment" },
      { fps: 15, qrbox: { width: 280, height: 280 } },
      onScanSuccess,
      () => {}
    );
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch {}
  };

  const onScanSuccess = async (decodedText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    setScanStatus("loading");
    await stopScanner();

    // Vibrate on mobile
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([100]);
    }

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: decodedText }),
      });
      const data: ScanResult = await res.json();

      // Play sound
      if (data.status === "authorized") {
        playTone(880, 0.3, "sine");
      } else {
        playTone(220, 0.5, "sawtooth");
      }

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(data.status === "authorized" ? [100, 50, 100] : [400]);
      }

      setResult(data);
      setScanStatus(data.status);
    } catch {
      setScanStatus("invalid");
      setResult({ status: "invalid" });
    }

    // Auto-resume after 2.5 seconds
    resumeTimerRef.current = setTimeout(() => {
      handleResume();
    }, 2500);
  };

  const handleResume = async () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    processingRef.current = false;
    setResult(null);
    setScanStatus("scanning");
    await startScanner();
  };

  useEffect(() => {
    startScanner().catch((err) => {
      setErrorMsg("Camera access denied or unavailable. Please allow camera permissions and reload.");
    });
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      stopScanner();
    };
  }, []);

  const bg =
    scanStatus === "authorized" ? "#052e16"
    : scanStatus === "already_scanned" ? "#450a0a"
    : scanStatus === "invalid" ? "#1c1917"
    : "#0a0f1e";

  const accent =
    scanStatus === "authorized" ? "#4ade80"
    : scanStatus === "already_scanned" ? "#f87171"
    : scanStatus === "invalid" ? "#9ca3af"
    : "#F0B429";

  return (
    <div style={{
      minHeight: "100vh", background: bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", fontFamily: "'Inter','Segoe UI',sans-serif",
      transition: "background 0.3s ease", padding: 24, boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, background: "rgba(0,0,0,0.4)", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#F0B429", fontWeight: 700 }}>ESEN 2026 · SCANNER</div>
        <a href="/admin" style={{ fontSize: 12, color: "#6b7280", textDecoration: "none" }}>← Admin</a>
      </div>

      {/* Result overlay */}
      {scanStatus !== "scanning" && scanStatus !== "loading" && (
        <div style={{
          position: "fixed", inset: 0, background: bg,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 50, padding: 32, textAlign: "center",
          transition: "all 0.2s ease",
        }}>
          {/* Icon */}
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            border: `4px solid ${accent}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 64, marginBottom: 28,
            boxShadow: `0 0 60px ${accent}40`,
          }}>
            {scanStatus === "authorized" ? "✓" : scanStatus === "already_scanned" ? "⊘" : "✕"}
          </div>

          {/* Status label */}
          <div style={{ fontSize: 36, fontWeight: 800, color: accent, letterSpacing: 2, marginBottom: 16, lineHeight: 1.1 }}>
            {scanStatus === "authorized" && "ACCESS AUTHORIZED"}
            {scanStatus === "already_scanned" && "ALREADY SCANNED"}
            {scanStatus === "invalid" && "INVALID QR CODE"}
          </div>

          {/* Attendee details */}
          {result && (result.name || result.type) && (
            <div style={{
              background: "rgba(255,255,255,0.05)", border: `1px solid ${accent}30`,
              borderRadius: 12, padding: "20px 28px", marginBottom: 28, maxWidth: 380, width: "100%",
            }}>
              {result.name && <div style={{ fontSize: 20, fontWeight: 700, color: "#f9fafb", marginBottom: 6 }}>{result.name}</div>}
              {result.type && <div style={{ fontSize: 14, color: accent, letterSpacing: 1, marginBottom: 6 }}>{result.type.toUpperCase()}</div>}
              {result.classe && <div style={{ fontSize: 13, color: "#9ca3af" }}>{result.classe} · {result.specialty}</div>}
              {result.scannedAt && scanStatus === "already_scanned" && (
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
                  First scanned: {new Date(result.scannedAt).toLocaleTimeString("fr-TN")}
                </div>
              )}
              {result.scannedAt && scanStatus === "authorized" && (
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
                  ✓ Checked in at {new Date(result.scannedAt).toLocaleTimeString("fr-TN")}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleResume}
            style={{
              padding: "14px 40px", borderRadius: 12,
              background: accent, color: "#000", fontSize: 16, fontWeight: 800,
              border: "none", cursor: "pointer", letterSpacing: 1,
            }}
          >
            SCAN NEXT
          </button>
          <div style={{ fontSize: 12, color: "#4b5563", marginTop: 12 }}>Auto-resumes in 2.5 seconds…</div>
        </div>
      )}

      {/* Loading */}
      {scanStatus === "loading" && (
        <div style={{
          position: "fixed", inset: 0, background: "#0a0f1e",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
        }}>
          <div style={{ fontSize: 18, color: "#F0B429", fontWeight: 600 }}>Verifying…</div>
        </div>
      )}

      {/* Camera view */}
      <div style={{ marginTop: 60, width: "100%", maxWidth: 400 }}>
        {errorMsg ? (
          <div style={{
            background: "#450a0a", border: "1px solid #dc2626", borderRadius: 12,
            padding: 24, color: "#f87171", textAlign: "center", fontSize: 15,
          }}>
            {errorMsg}
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: 4, color: "#F0B429", fontWeight: 700, marginBottom: 6 }}>
                POINT CAMERA AT QR CODE
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Hold steady — scanning automatically</div>
            </div>
            <div
              id="qr-reader"
              ref={containerRef}
              style={{
                borderRadius: 16, overflow: "hidden",
                border: "2px solid #1e3a5f",
                boxShadow: "0 0 40px rgba(27,58,140,0.3)",
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

function playTone(frequency: number, duration: number, type: OscillatorType) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {}
}
