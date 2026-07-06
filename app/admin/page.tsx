"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { VALID_CLASSES, VALID_SPECIALTIES, NON_STUDENT_ROLES } from "@/lib/rsvp";

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
  voided?: boolean;
}

interface Guest {
  id: string;
  guestIndex: number;
  parentId: string;
  parentName: string;
  scanned: boolean;
  scannedAt?: string | null;
  voided?: boolean;
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
type Tab = "students" | "guests" | "history" | "gallery" | "wall";

interface HistoryEntry {
  date: string;
  action: "modification" | "annulation" | "suppression" | "renvoi" | "walk-in" | "check-in";
  studentId: string;
  name: string;
  details: string;
}

export default function AdminPage() {
  const [view, setView] = useState<View>("login");
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [mediaWall, setMediaWall] = useState<MediaItem[]>([]);
  const [mediaGallery, setMediaGallery] = useState<MediaItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("students");
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const [modalStudent, setModalStudent] = useState<Student | null>(null);
  const [modalQRs, setModalQRs] = useState<{ studentQR: string; guestQRs: string[] } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", classe: "", specialty: "",
  });
  const [editResend, setEditResend] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { setPage(1); }, [tab, search]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/history", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.entries || []);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { if (tab === "history") fetchHistory(); }, [tab, fetchHistory]);

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

  const handleAddGuest = async (student: Student) => {
    if (student.guestCount >= 3) { showToast("Maximum 3 accompagnateurs déjà atteint.", false); return; }
    if (!confirm(
      `Ajouter un ${student.guestCount + 1}e accompagnateur pour ${student.firstName} ${student.lastName} ?\n\nUn nouveau billet QR sera créé et l'email de tickets sera renvoyé.`
    )) return;
    setActionLoading(student.id + "-addguest");
    const res = await fetch("/api/admin/add-guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id, resend: true }),
    });
    const data = await res.json().catch(() => ({}));
    setActionLoading(null);
    if (res.ok) {
      showToast(
        data.resent
          ? `Accompagnateur ajouté (${data.guestCount}/3) — tickets renvoyés.`
          : `Accompagnateur ajouté (${data.guestCount}/3) — mais l'email a échoué, utilise ✉.`,
        data.resent
      );
      fetchData();
    } else {
      showToast(data.error || "Échec de l'ajout.", false);
    }
  };

  const handleVoid = async (student: Student) => {
    if (student.voided) { showToast("Déjà annulé.", true); return; }
    const reason = prompt(
      `Annuler les tickets de ${student.firstName} ${student.lastName} ?\n\nLes QR codes (étudiant + ${student.guestCount} invité${student.guestCount === 1 ? "" : "s"}) seront refusés au portail.\n\nMotif (optionnel) :`,
      "Doublon"
    );
    if (reason === null) return;
    setActionLoading(student.id + "-void");
    const res = await fetch("/api/admin/void", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id, reason }),
    });
    setActionLoading(null);
    if (res.ok) {
      const data = await res.json();
      showToast(`Annulé (${data.voided} ticket${data.voided === 1 ? "" : "s"}).`, true);
      fetchData();
    } else {
      showToast("Échec de l'annulation.", false);
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

  const openEdit = (student: Student) => {
    setEditStudent(student);
    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      classe: student.classe,
      specialty: student.specialty || "",
    });
    setEditResend(false);
    setEditError("");
    setEditFieldErrors({});
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    setEditLoading(true);
    setEditError("");
    setEditFieldErrors({});
    const res = await fetch("/api/admin/update-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: editStudent.id,
        ...editForm,
        resend: editResend,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setEditLoading(false);
    if (res.ok) {
      setEditStudent(null);
      showToast(editResend ? "Mise à jour enregistrée et ticket renvoyé." : "Mise à jour enregistrée.", true);
      fetchData();
    } else {
      setEditError(data.error || "Échec de la mise à jour.");
      if (data.fields) setEditFieldErrors(data.fields);
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
          <a href="/admin/jour-j" target="_blank" style={{
            padding: "8px 16px", borderRadius: 8, background: "#3a1e00",
            border: "1px solid #fb923c", color: "#fb923c", fontSize: 13, fontWeight: 600,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            🎯 Jour J
          </a>
          <a href="/admin/analytics" target="_blank" style={{
            padding: "8px 16px", borderRadius: 8, background: "#1e2a00",
            border: "1px solid #F0B429", color: "#F0B429", fontSize: 13, fontWeight: 600,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            📈 Analytics
          </a>
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
          {(() => {
            const activeStudents = students.filter((s) => !s.voided).length;
            const voidedStudents = students.length - activeStudents;
            const activeGuests = guests.filter((g) => !g.voided).length;
            const voidedGuests = guests.length - activeGuests;
            const label = (base: string, active: number, voided: number) =>
              voided > 0 ? `${base} (${active}) · ${voided} annulé${voided === 1 ? "" : "s"}` : `${base} (${active})`;
            return [
              { key: "students" as Tab, label: label("Étudiants", activeStudents, voidedStudents) },
              { key: "guests" as Tab, label: label("Accompagnateurs", activeGuests, voidedGuests) },
              { key: "history" as Tab, label: "Historique" },
              { key: "gallery" as Tab, label: `Galerie (${mediaGallery.length})` },
              { key: "wall" as Tab, label: `Mur (${mediaWall.length})` },
            ];
          })().map((t) => (
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
        ) : tab === "history" ? (
          <HistoryPanel entries={history} loading={historyLoading} onRefresh={fetchHistory} />
        ) : tab === "guests" ? (
          <>
            <GuestTable
              guests={filteredGuests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
              total={filteredGuests.length}
              rangeStart={(page - 1) * PAGE_SIZE}
              search={search}
            />
            <Pagination total={filteredGuests.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280", fontSize: 16 }}>
            {search ? "No results found." : "No registrations yet."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#111827", borderBottom: "2px solid #1e3a5f" }}>
                  {["Name", "Email", "Phone", "Class", "Major", "Guests", "Registered", "Check-in", "Email Statut", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#9ca3af", fontWeight: 600, fontSize: 11, letterSpacing: 1, whiteSpace: "nowrap" }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? "#0d1526" : "#0a0f1e", borderBottom: "1px solid #1e2a3f", opacity: s.voided ? 0.55 : 1 }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#f9fafb", whiteSpace: "nowrap" }}>
                      {s.firstName} {s.lastName}
                      {s.voided && (
                        <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "#5a1414", color: "#fca5a5", letterSpacing: 0.5, verticalAlign: "middle" }}>ANNULÉ</span>
                      )}
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
                          onClick={() => openEdit(s)}
                          style={actionBtn("#0a2540", "#38bdf8")}
                          title="Modifier"
                        >✎</button>
                        <button
                          onClick={() => handleAddGuest(s)}
                          disabled={actionLoading === s.id + "-addguest" || s.guestCount >= 3}
                          style={{ ...actionBtn("#052e16", "#4ade80"), opacity: s.guestCount >= 3 ? 0.35 : 1 }}
                          title={s.guestCount >= 3 ? "Maximum 3 accompagnateurs" : "Ajouter un accompagnateur"}
                        >{actionLoading === s.id + "-addguest" ? "…" : "➕"}</button>
                        <button
                          onClick={() => handleVoid(s)}
                          disabled={actionLoading === s.id + "-void" || s.voided}
                          style={actionBtn("#2d1a05", "#fb923c")}
                          title={s.voided ? "Déjà annulé" : "Annuler les tickets"}
                        >{actionLoading === s.id + "-void" ? "…" : "🚫"}</button>
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
              {filtered.length === 0 ? "0" : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)}`} sur {filtered.length}
              {search ? ` (filtré de ${students.length})` : ""}
            </div>
            <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} />
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

      {/* Edit Student Modal */}
      {editStudent && (
        <div
          onClick={() => !editLoading && setEditStudent(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, overflowY: "auto",
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitEdit}
            style={{
              background: "#111827", border: "1px solid #1e3a5f", borderRadius: 16,
              padding: 28, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto",
              fontFamily: "'Inter','Segoe UI',sans-serif", color: "#fff",
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#F0B429", fontWeight: 700, marginBottom: 6 }}>
              MODIFIER L&apos;INSCRIPTION
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              {editStudent.firstName} {editStudent.lastName}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 22 }}>
              ID {editStudent.id.slice(0, 8)}… · {editStudent.guestCount} invité{editStudent.guestCount === 1 ? "" : "s"}
            </div>

            {(() => {
              const isNonStudent = NON_STUDENT_ROLES.includes(editForm.classe);
              const F = editForm; const FE = editFieldErrors;
              const set = (k: keyof typeof editForm, v: string) => setEditForm({ ...F, [k]: v });
              const label = { display: "block", fontSize: 11, color: "#9ca3af", marginBottom: 4, letterSpacing: 0.5 } as const;
              const input = (err?: string) => ({
                width: "100%", padding: "9px 12px", borderRadius: 8,
                background: "#0a0f1e", border: `1px solid ${err ? "#7f1d1d" : "#1e3a5f"}`,
                color: "#fff", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as const,
              });
              const errText = (err?: string) => err ? <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 3 }}>{err}</div> : null;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={label}>Prénom</label>
                    <input value={F.firstName} onChange={(e) => set("firstName", e.target.value)} style={input(FE.firstName)} />
                    {errText(FE.firstName)}
                  </div>
                  <div>
                    <label style={label}>Nom</label>
                    <input value={F.lastName} onChange={(e) => set("lastName", e.target.value)} style={input(FE.lastName)} />
                    {errText(FE.lastName)}
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={label}>Email</label>
                    <input type="email" value={F.email} onChange={(e) => set("email", e.target.value)} style={input(FE.email)} />
                    {errText(FE.email)}
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={label}>Téléphone</label>
                    <input value={F.phone} onChange={(e) => set("phone", e.target.value)} style={input(FE.phone)} />
                    {errText(FE.phone)}
                  </div>
                  <div>
                    <label style={label}>Classe</label>
                    <select value={F.classe} onChange={(e) => set("classe", e.target.value)} style={input(FE.classe)}>
                      {VALID_CLASSES.map((c) => <option key={c} value={c} style={{ background: "#0a0f1e" }}>{c}</option>)}
                    </select>
                    {errText(FE.classe)}
                  </div>
                  <div>
                    <label style={label}>Spécialité {isNonStudent && <span style={{ color: "#6b7280" }}>(non requise)</span>}</label>
                    <select value={F.specialty} onChange={(e) => set("specialty", e.target.value)} disabled={isNonStudent} style={{ ...input(FE.specialty), opacity: isNonStudent ? 0.4 : 1 }}>
                      <option value="" style={{ background: "#0a0f1e" }}>—</option>
                      {VALID_SPECIALTIES.map((s) => <option key={s} value={s} style={{ background: "#0a0f1e" }}>{s}</option>)}
                    </select>
                    {errText(FE.specialty)}
                  </div>
                </div>
              );
            })()}

            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, fontSize: 13, color: "#9ca3af", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={editResend}
                onChange={(e) => setEditResend(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#F0B429" }}
              />
              Renvoyer le ticket par email après enregistrement
            </label>

            {editError && (
              <div style={{ marginTop: 14, padding: "10px 12px", background: "#2d0a0a", border: "1px solid #7f1d1d", borderRadius: 8, color: "#fca5a5", fontSize: 13 }}>
                {editError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setEditStudent(null)}
                disabled={editLoading}
                style={{
                  padding: "10px 18px", borderRadius: 8, background: "#1f2937",
                  border: "1px solid #374151", color: "#9ca3af",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={editLoading}
                style={{
                  padding: "10px 20px", borderRadius: 8, background: "#1B3A8C",
                  border: "1px solid #F0B429", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  opacity: editLoading ? 0.6 : 1,
                }}
              >
                {editLoading ? "…" : editResend ? "Enregistrer & renvoyer" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ entries, loading, onRefresh }: { entries: HistoryEntry[]; loading: boolean; onRefresh: () => void }) {
  const [filter, setFilter] = useState<"" | HistoryEntry["action"]>("");
  const [q, setQ] = useState("");
  const shown = entries.filter((e) => {
    if (filter && e.action !== filter) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!(e.name.toLowerCase().includes(s) || e.details.toLowerCase().includes(s))) return false;
    }
    return true;
  });
  const badge = (a: HistoryEntry["action"]) => {
    const map: Record<HistoryEntry["action"], { bg: string; fg: string; label: string }> = {
      modification: { bg: "#0a2540", fg: "#38bdf8", label: "Modification" },
      annulation:   { bg: "#2d1a05", fg: "#fb923c", label: "Annulation" },
      suppression:  { bg: "#2d0a0a", fg: "#f87171", label: "Suppression" },
      renvoi:       { bg: "#1e2a00", fg: "#F0B429", label: "Renvoi" },
      "walk-in":    { bg: "#1e3a5f", fg: "#60a5fa", label: "Walk-in" },
      "check-in":   { bg: "#052e16", fg: "#4ade80", label: "Check-in" },
    };
    const c = map[a];
    return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 12, background: c.bg, color: c.fg, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{c.label}</span>;
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Chercher par nom ou détail…"
          style={{ flex: "1 1 240px", padding: "10px 14px", borderRadius: 10, background: "#0a0f1e", border: "1px solid #1e3a5f", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value as "" | HistoryEntry["action"])} style={{ padding: "10px 12px", borderRadius: 10, background: "#0a0f1e", border: "1px solid #1e3a5f", color: "#fff", fontSize: 13 }}>
          <option value="">Toutes les actions</option>
          <option value="check-in">Check-ins</option>
          <option value="modification">Modifications</option>
          <option value="annulation">Annulations</option>
          <option value="suppression">Suppressions</option>
          <option value="renvoi">Renvois</option>
        </select>
        <button onClick={onRefresh} style={{ padding: "10px 16px", borderRadius: 10, background: "#1B3A8C", border: "1px solid #F0B429", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>↺ Actualiser</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Chargement…</div>
      ) : shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280", background: "#111827", border: "1px solid #1e3a5f", borderRadius: 12 }}>
          {entries.length === 0 ? "Aucune modification enregistrée pour le moment." : "Aucun résultat pour ces filtres."}
        </div>
      ) : (
        <div style={{ background: "#111827", border: "1px solid #1e3a5f", borderRadius: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0a1224", color: "#9ca3af", textAlign: "left", fontSize: 11, letterSpacing: 1 }}>
                {["DATE", "ACTION", "NOM", "DÉTAILS"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", borderBottom: "1px solid #1e2a3f", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((e, i) => (
                <tr key={`${e.date}-${i}`} style={{ background: i % 2 === 0 ? "#0d1526" : "#0a0f1e", borderBottom: "1px solid #1e2a3f" }}>
                  <td style={{ padding: "12px 16px", color: "#9ca3af", whiteSpace: "nowrap", fontSize: 12 }}>{new Date(e.date).toLocaleString("fr-TN")}</td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>{badge(e.action)}</td>
                  <td style={{ padding: "12px 16px", color: "#f9fafb", fontWeight: 600, whiteSpace: "nowrap" }}>{e.name || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#9ca3af" }}>{e.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "12px 16px", color: "#6b7280", fontSize: 12 }}>
            {shown.length} entrée{shown.length === 1 ? "" : "s"}{shown.length !== entries.length ? ` (filtré de ${entries.length})` : ""}
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

function Pagination({ total, page, pageSize, onPage }: { total: number; page: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1);
  const btn = (label: string, p: number, active: boolean, disabled = false) => (
    <button
      key={label}
      onClick={() => !disabled && onPage(p)}
      disabled={disabled}
      style={{
        padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        background: active ? "#1B3A8C" : "#111827",
        border: `1px solid ${active ? "#F0B429" : "#1e3a5f"}`,
        color: disabled ? "#4b5563" : active ? "#fff" : "#9ca3af",
      }}
    >{label}</button>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", padding: "8px 16px 4px" }}>
      {btn("‹ Préc.", page - 1, false, page <= 1)}
      {nums.map((n) => btn(`${(n - 1) * pageSize + 1}–${Math.min(n * pageSize, total)}`, n, n === page))}
      {btn("Suiv. ›", page + 1, false, page >= pages)}
    </div>
  );
}

function GuestTable({ guests, total, rangeStart = 0, search }: { guests: Guest[]; total: number; rangeStart?: number; search: string }) {
  if (total === 0) {
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
        {rangeStart + 1}–{rangeStart + guests.length} sur {total} accompagnateur{total !== 1 ? "s" : ""}
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
