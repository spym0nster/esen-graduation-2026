"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  classe: string;
  specialty: string;
  guestCount: number;
  guestIds: string[];
  scanned: boolean;
  scannedAt?: string | null;
  emailStatus: string;
  registeredAt: string;
}

interface Guest {
  id: string;
  guestIndex: number;
  parentId: string;
  parentName: string;
  scanned: boolean;
  scannedAt?: string | null;
}

interface Stats {
  totalStudents: number;
  totalGuests: number;
  totalExpected: number;
  studentsCheckedIn: number;
  guestsCheckedIn: number;
}

interface MediaItem {
  id: string;
  type: string;
  url: string;
  caption: string;
  author: string;
  createdAt: string;
}

type View = "login" | "dashboard";
type Tab = "students" | "guests" | "gallery" | "wall";

export default function AdminPage() {
  const [view, setView] = useState<View>("login");
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [mediaWall, setMediaWall] = useState<MediaItem[]>([]);
  const [mediaGallery, setMediaGallery] = useState<MediaItem[]>([]);
  const [tab, setTab] = useState<Tab>("students");
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalStudent, setModalStudent] = useState<Student | null>(null);
  const [modalQRs, setModalQRs] = useState<{ studentQR: string; guestQRs: string[] } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, stRes, wRes, gRes] = await Promise.all([
        fetch("/api/admin/attendees"),
        fetch("/api/admin/stats"),
        fetch("/api/media?type=wall"),
        fetch("/api/media?type=gallery"),
      ]);
      if (sRes.status === 401 || stRes.status === 401) {
        setView("login");
        return;
      }
      const { students: s, guests: g } = await sRes.json();
      const st = await stRes.json();
      setStudents(s || []);
      setGuests(g || []);
      setStats(st);
      try { setMediaWall((await wRes.json()).items || []); } catch {}
      try { setMediaGallery((await gRes.json()).items || []); } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setLoginLoading(false);
    if (res.ok) {
      setView("dashboard");
      fetchData();
    } else {
      setLoginError("Incorrect passcode. Please try again.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setView("login");
    setPasscode("");
    setStudents([]);
    setGuests([]);
    setMediaWall([]);
    setMediaGallery([]);
    setStats(null);
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`Delete ${student.firstName} ${student.lastName}? This cannot be undone.`)) return;
    setActionLoading(student.id + "-delete");
    const res = await fetch("/api/admin/attendees", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id }),
    });
    setActionLoading(null);
    if (res.ok) {
      showToast("Registration deleted.", true);
      fetchData();
    } else {
      showToast("Failed to delete.", false);
    }
  };

  const handleResend = async (studentId: string) => {
    setActionLoading(studentId + "-resend");
    const res = await fetch("/api/admin/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    setActionLoading(null);
    if (res.ok) {
      showToast("Email resent successfully.", true);
      fetchData();
    } else {
      showToast("Failed to resend email.", false);
    }
  };

  const handleViewQR = async (student: Student) => {
    setModalStudent(student);
    setQrLoading(true);
    const res = await fetch(`/api/admin/qr?studentId=${student.id}`);
    setQrLoading(false);
    if (res.ok) {
      const data = await res.json();
      setModalQRs(data);
    }
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      s.classe.toLowerCase().includes(q) ||
      s.specialty.toLowerCase().includes(q)
    );
  });

  const filteredGuests = guests.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.parentName.toLowerCase().includes(q) ||
      String(g.guestIndex).includes(q)
    );
  });

  if (view === "login") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0a0f1e", fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}>
        <div style={{
          background: "#111827", border: "1px solid #1e3a5f", borderRadius: 16,
          padding: "48px 40px", width: "100%", maxWidth: 400, boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 13, letterSpacing: 4, color: "#F0B429", fontWeight: 600, marginBottom: 8 }}>
              ESEN · GRADUATION 2026
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>Admin Dashboard</div>
            <div style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>Enter your passcode to continue</div>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 8,
                background: "#1f2937", border: "1px solid #374151", color: "#fff",
                fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 16,
              }}
              autoFocus
            />
            {loginError && (
              <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{loginError}</div>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 8,
                background: "linear-gradient(135deg, #1B3A8C, #0F2560)",
                border: "1px solid #F0B429", color: "#fff", fontSize: 15,
                fontWeight: 600, cursor: loginLoading ? "wait" : "pointer",
                letterSpacing: 1,
              }}
            >
              {loginLoading ? "Verifying…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#fff", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          background: toast.ok ? "#052e16" : "#450a0a",
          border: `1px solid ${toast.ok ? "#16a34a" : "#dc2626"}`,
          color: toast.ok ? "#4ade80" : "#f87171",
          borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600,
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{
        background: "#111827", borderBottom: "1px solid #1e3a5f",
        padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#F0B429", fontWeight: 600 }}>ESEN · GRADUATION 2026</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Admin Dashboard</div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/admin/live" target="_blank" style={{
            padding: "8px 16px", borderRadius: 8, background: "#1e2a00",
            border: "1px solid #F0B429", color: "#F0B429", fontSize: 13, fontWeight: 600,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            📊 Live
          </a>
          <a href="/ceremony" target="_blank" style={{
            padding: "8px 16px", borderRadius: 8, background: "#1f2937",
            border: "1px solid #374151", color: "#9ca3af", fontSize: 13, fontWeight: 600,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            🖥️ Écran
          </a>
          <a href="/wall" target="_blank" style={{
            padding: "8px 16px", borderRadius: 8, background: "#1f2937",
            border: "1px solid #374151", color: "#9ca3af", fontSize: 13, fontWeight: 600,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            🖼️ Mur
          </a>
          <a href="/scanner" target="_blank" style={{
            padding: "8px 16px", borderRadius: 8, background: "#1f2937",
            border: "1px solid #374151", color: "#9ca3af", fontSize: 13, fontWeight: 600,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            📷 Scanner
          </a>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px", borderRadius: 8, background: "#1f2937",
              border: "1px solid #374151", color: "#9ca3af", fontSize: 13,
              cursor: "pointer", fontWeight: 600,
            }}
          >Sign Out</button>
        </div>
      </header>

      <main style={{ padding: "32px" }}>
        {/* Stats */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Total Registrations", value: stats.totalStudents, color: "#3b82f6" },
              { label: "Total Guests", value: stats.totalGuests, color: "#8b5cf6" },
              { label: "Expected Attendance", value: stats.totalExpected, color: "#F0B429" },
              { label: "Students Checked In", value: stats.studentsCheckedIn, color: "#10b981" },
              { label: "Guests Checked In", value: stats.guestsCheckedIn, color: "#06b6d4" },
            ].map((s) => (
              <div key={s.label} style={{
                background: "#111827", border: "1px solid #1e3a5f",
                borderRadius: 12, padding: "20px 24px",
              }}>
                <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>
                  {s.label.toUpperCase()}
                </div>
                <div style={{ fontSize: 36, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {([
            { key: "students" as Tab, label: `Étudiants (${students.length})` },
            { key: "guests" as Tab, label: `Accompagnateurs (${guests.length})` },
            { key: "gallery" as Tab, label: `Galerie (${mediaGallery.length})` },
            { key: "wall" as Tab, label: `Mur (${mediaWall.length})` },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
                background: tab === t.key ? "#1B3A8C" : "#111827",
                border: `1px solid ${tab === t.key ? "#F0B429" : "#1e3a5f"}`,
                color: tab === t.key ? "#fff" : "#9ca3af",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search by name, email, phone, class or major…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 260, padding: "10px 16px", borderRadius: 8,
              background: "#111827", border: "1px solid #1e3a5f", color: "#fff",
              fontSize: 14, outline: "none",
            }}
          />
          <button onClick={() => window.open("/api/admin/export?format=csv", "_blank")} style={btnStyle("#1f2937", "#374151", "#9ca3af")}>
            ↓ CSV
          </button>
          <button onClick={() => window.open("/api/admin/export?format=xlsx", "_blank")} style={btnStyle("#1f2937", "#374151", "#9ca3af")}>
            ↓ Excel
          </button>
          <button onClick={fetchData} style={btnStyle("#1B3A8C", "#F0B429", "#fff")}>
            ↺ Refresh
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280", fontSize: 16 }}>Loading registrations…</div>
        ) : tab === "gallery" ? (
          <MediaPanel type="gallery" items={mediaGallery} onChange={fetchData} showToast={showToast} />
        ) : tab === "wall" ? (
          <MediaPanel type="wall" items={mediaWall} onChange={fetchData} showToast={showToast} />
        ) : tab === "guests" ? (
          <GuestTable guests={filteredGuests} total={guests.length} search={search} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280", fontSize: 16 }}>
            {search ? "No results found." : "No registrations yet."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#111827", borderBottom: "2px solid #1e3a5f" }}>
                  {["Name", "Email", "Phone", "Class", "Major", "Guests", "Registered", "Check-in", "Email", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#9ca3af", fontWeight: 600, fontSize: 11, letterSpacing: 1, whiteSpace: "nowrap" }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? "#0d1526" : "#0a0f1e", borderBottom: "1px solid #1e2a3f" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#f9fafb", whiteSpace: "nowrap" }}>
                      {s.firstName} {s.lastName}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#9ca3af" }}>{s.email}</td>
                    <td style={{ padding: "12px 16px", color: "#9ca3af", whiteSpace: "nowrap" }}>{s.phone}</td>
                    <td style={{ padding: "12px 16px", color: "#9ca3af" }}>{s.classe}</td>
                    <td style={{ padding: "12px 16px", color: "#9ca3af" }}>{s.specialty}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{
                        display: "inline-block", padding: "2px 10px", borderRadius: 20,
                        background: "#1e3a5f", color: "#60a5fa", fontSize: 12, fontWeight: 700,
                      }}>{s.guestCount}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", whiteSpace: "nowrap", fontSize: 12 }}>
                      {new Date(s.registeredAt).toLocaleString("fr-TN")}
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <StatusBadge ok={s.scanned} label={s.scanned ? "Checked In" : "Pending"} />
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <StatusBadge ok={s.emailStatus === "Sent"} label={s.emailStatus || "Pending"} />
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleViewQR(s)}
                          style={actionBtn("#1e3a5f", "#60a5fa")}
                          title="View QR Codes"
                        >QR</button>
                        <button
                          onClick={() => handleResend(s.id)}
                          disabled={actionLoading === s.id + "-resend"}
                          style={actionBtn("#1e2a00", "#F0B429")}
                          title="Resend Email"
                        >{actionLoading === s.id + "-resend" ? "…" : "✉"}</button>
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={actionLoading === s.id + "-delete"}
                          style={actionBtn("#2d0a0a", "#f87171")}
                          title="Delete Registration"
                        >{actionLoading === s.id + "-delete" ? "…" : "✕"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "12px 16px", color: "#6b7280", fontSize: 13 }}>
              Showing {filtered.length} of {students.length} registration{students.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </main>

      {/* QR Modal */}
      {modalStudent && (
        <div
          onClick={() => { setModalStudent(null); setModalQRs(null); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#111827", border: "1px solid #1e3a5f", borderRadius: 16,
              padding: 32, maxWidth: 640, width: "100%", maxHeight: "90vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
                  {modalStudent.firstName} {modalStudent.lastName}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  {modalStudent.classe} · {modalStudent.specialty} · {modalStudent.guestCount} guest{modalStudent.guestCount !== 1 ? "s" : ""}
                </div>
              </div>
              <button
                onClick={() => { setModalStudent(null); setModalQRs(null); }}
                style={{ background: "none", border: "none", color: "#6b7280", fontSize: 24, cursor: "pointer" }}
              >✕</button>
            </div>

            {qrLoading && (
              <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Generating QR codes…</div>
            )}

            {modalQRs && !qrLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, letterSpacing: 3, color: "#1B3A8C", fontWeight: 700, marginBottom: 12 }}>STUDENT TICKET</div>
                  <Image src={modalQRs.studentQR} width={200} height={200} alt="Student QR" unoptimized style={{ borderRadius: 8 }} />
                </div>
                {modalQRs.guestQRs.map((qr, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, letterSpacing: 3, color: "#B8860B", fontWeight: 700, marginBottom: 12 }}>
                      GUEST TICKET #{i + 1}
                    </div>
                    <Image src={qr} width={200} height={200} alt={`Guest QR ${i + 1}`} unoptimized style={{ borderRadius: 8 }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MediaPanel({
  type, items, onChange, showToast,
}: {
  type: "gallery" | "wall";
  items: MediaItem[];
  onChange: () => void;
  showToast: (msg: string, ok: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const upload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Ce n'est pas une image.", false); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "gallery");
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      showToast("Photo ajoutée à la galerie.", true);
      onChange();
    } catch {
      showToast("Échec de l'upload.", false);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette photo ? Elle disparaîtra du site/mur.")) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      showToast("Photo supprimée.", true);
      onChange();
    } catch {
      showToast("Échec de la suppression.", false);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {type === "gallery" && (
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 8,
            background: "#1B3A8C", border: "1px solid #F0B429", color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: uploading ? "wait" : "pointer",
          }}>
            {uploading ? "Upload…" : "＋ Ajouter une photo à la galerie"}
            <input type="file" accept="image/*" disabled={uploading}
              onChange={(e) => upload(e.target.files?.[0] || null)} style={{ display: "none" }} />
          </label>
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>
            Ces photos apparaissent instantanément dans la galerie du site public.
          </div>
        </div>
      )}
      {type === "wall" && (
        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>
          Souvenirs postés par les étudiants (affichage automatique). Supprime ici tout contenu indésirable.
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280", fontSize: 16 }}>
          {type === "gallery" ? "Aucune photo dans la galerie." : "Aucun souvenir posté."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {items.map((m) => (
            <div key={m.id} style={{ position: "relative", background: "#111827", border: "1px solid #1e3a5f", borderRadius: 12, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.caption || "photo"} style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
              {(m.caption || m.author) && (
                <div style={{ padding: "8px 10px" }}>
                  {m.caption && <div style={{ fontSize: 13, color: "#f9fafb", lineHeight: 1.3 }}>{m.caption}</div>}
                  {m.author && <div style={{ fontSize: 11, color: "#F0B429", marginTop: 2 }}>— {m.author}</div>}
                </div>
              )}
              <button
                onClick={() => remove(m.id)}
                disabled={deleting === m.id}
                title="Supprimer"
                style={{
                  position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: 8,
                  background: "rgba(45,10,10,0.9)", border: "1px solid #f87171", color: "#f87171",
                  fontSize: 14, fontWeight: 800, cursor: "pointer", lineHeight: 1,
                }}
              >{deleting === m.id ? "…" : "✕"}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GuestTable({ guests, total, search }: { guests: Guest[]; total: number; search: string }) {
  if (guests.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#6b7280", fontSize: 16 }}>
        {search ? "Aucun accompagnateur trouvé." : "Aucun accompagnateur."}
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#111827", borderBottom: "2px solid #1e3a5f" }}>
            {["Accompagnateur", "Étudiant", "N°", "Check-in", "Scanné le"].map((h) => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#9ca3af", fontWeight: 600, fontSize: 11, letterSpacing: 1, whiteSpace: "nowrap" }}>
                {h.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guests.map((g, i) => (
            <tr key={g.id} style={{ background: i % 2 === 0 ? "#0d1526" : "#0a0f1e", borderBottom: "1px solid #1e2a3f" }}>
              <td style={{ padding: "12px 16px", fontWeight: 600, color: "#f9fafb", whiteSpace: "nowrap" }}>
                Accompagnateur n°{g.guestIndex} de {g.parentName}
              </td>
              <td style={{ padding: "12px 16px", color: "#9ca3af", whiteSpace: "nowrap" }}>{g.parentName}</td>
              <td style={{ padding: "12px 16px", textAlign: "center" }}>
                <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, background: "#1e3a5f", color: "#60a5fa", fontSize: 12, fontWeight: 700 }}>{g.guestIndex}</span>
              </td>
              <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                <StatusBadge ok={g.scanned} label={g.scanned ? "Checked In" : "Pending"} />
              </td>
              <td style={{ padding: "12px 16px", color: "#6b7280", whiteSpace: "nowrap", fontSize: 12 }}>
                {g.scannedAt ? new Date(g.scannedAt).toLocaleString("fr-TN") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: "12px 16px", color: "#6b7280", fontSize: 13 }}>
        Showing {guests.length} of {total} accompagnateur{total !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: ok ? "#052e16" : "#1f2937",
      color: ok ? "#4ade80" : "#6b7280",
      border: `1px solid ${ok ? "#16a34a" : "#374151"}`,
    }}>{label}</span>
  );
}

function btnStyle(bg: string, border: string, color: string): React.CSSProperties {
  return {
    padding: "10px 16px", borderRadius: 8, background: bg,
    border: `1px solid ${border}`, color, fontSize: 13,
    fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
  };
}

function actionBtn(bg: string, color: string): React.CSSProperties {
  return {
    padding: "5px 10px", borderRadius: 6, background: bg,
    border: `1px solid ${color}40`, color, fontSize: 12,
    fontWeight: 700, cursor: "pointer",
  };
}
