"use client";

import { useEffect, useState } from "react";

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
  groups: Group[];
}

// Deliberately plain, static, black-on-white markup with no dark theme, no
// CSS grid/flex, and no print-vs-screen state toggling: Chrome's print
// pagination doesn't reliably re-flow a page whose layout mode is switched
// right before printing, so the safest fix is to never need that switch —
// this view already looks like a printed page the moment it loads.
export default function AttendancePrintPage() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/attendance", { cache: "no-store" });
        if (res.status === 401) { setAuthed(false); return; }
        const json: AttendanceData = await res.json();
        setGroups(json.groups);
      } catch {}
    })();
  }, []);

  if (!authed) {
    return (
      <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        Session requise. <a href="/admin">Aller à /admin</a>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", color: "#000", fontFamily: "Arial, Helvetica, sans-serif", padding: 24 }}>
      <button
        onClick={() => window.print()}
        className="no-print"
        style={{ marginBottom: 20, padding: "10px 20px", borderRadius: 8, background: "#F0B429", border: "1px solid #000", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
      >
        🖨 Imprimer
      </button>

      {groups === null && <div>Chargement…</div>}

      {(groups ?? []).map((g, i) => (
        <div
          key={`${g.classe}|${g.specialty}`}
          style={{
            pageBreakAfter: i === groups!.length - 1 ? "auto" : "always",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 22 }}>{g.label}</div>
            <div style={{ fontWeight: 700, fontSize: 15, border: "1px solid #000", borderRadius: 12, padding: "3px 10px" }}>
              {g.present.length} présents
            </div>
          </div>

          {g.present.length === 0 && (
            <div style={{ fontSize: 14, padding: "4px 0 12px" }}>Aucun diplômé scanné pour l&apos;instant.</div>
          )}
          {g.present.map((p, idx) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 16, padding: "6px 0", borderBottom: "1px solid #ccc" }}>
              <span>#{idx + 1} {p.name}</span>
              {p.scannedAt && <span>{p.scannedAt}</span>}
            </div>
          ))}

          {g.absent.length > 0 && (
            <div style={{ marginTop: 16, borderTop: "2px solid #000", paddingTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                ⚠ Non scannés — peut-être absents ({g.absent.length})
              </div>
              {g.absent.map((p) => (
                <div key={p.id} style={{ fontSize: 14, padding: "3px 0" }}>{p.name}</div>
              ))}
            </div>
          )}
        </div>
      ))}

      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
