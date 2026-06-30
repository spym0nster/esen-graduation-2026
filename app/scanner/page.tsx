"use client";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function ScannerPage() {
  const [result, setResult] = useState<{
    status: string;
    name?: string;
    type?: string;
    scannedAt?: string;
  } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(true);

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (!scanningRef.current) return;
          scanningRef.current = false;

          let id = decodedText;
          const match = decodedText.match(/\/verify\/(?:guest\/)?([a-f0-9-]+)/);
          if (match) id = match[1];

          try {
            const res = await fetch("/api/scanner/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id }),
            });
            const data = await res.json();
            setResult(data);
          } catch {
            setResult({ status: "error" });
          }

          setTimeout(() => {
            setResult(null);
            scanningRef.current = true;
          }, 3000);
        },
        () => {}
      )
      .catch((err) => {
        console.error("Camera start failed:", err);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F2560",
        color: "white",
        textAlign: "center",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ color: "#F0B429", fontSize: "18px", letterSpacing: "2px" }}>
        🎓 ESEN GRADUATION SCANNER
      </h1>

      <div
        id="reader"
        style={{
          maxWidth: "400px",
          margin: "20px auto",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      />

      {result && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            borderRadius: "12px",
            fontSize: "20px",
            fontWeight: "bold",
            maxWidth: "400px",
            marginLeft: "auto",
            marginRight: "auto",
            background:
              result.status === "success"
                ? "rgba(20,150,60,0.95)"
                : result.status === "already_scanned"
                ? "rgba(200,150,20,0.95)"
                : "rgba(200,40,40,0.95)",
          }}
        >
          {result.status === "success" && (
            <>
              ✓ ENTRÉE AUTORISÉE<br />
              {result.name}<br />
              <small>{result.type}</small>
            </>
          )}
          {result.status === "already_scanned" && (
            <>
              ⚠ DÉJÀ SCANNÉ<br />
              {result.name}<br />
              <small>{result.scannedAt}</small>
            </>
          )}
          {(result.status === "invalid" || result.status === "error") && <>✕ CODE INVALIDE</>}
        </div>
      )}
    </div>
  );
}
