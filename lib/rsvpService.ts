import {
  sheetGetRows,
  sheetAppendRow,
  sheetUpdateRow,
  sheetDeleteRows,
} from "./googleSheets";

// ─── Column indices ────────────────────────────────────────────────────────────
// Students tab
const S = {
  id: 0, firstName: 1, lastName: 2, email: 3, phone: 4,
  classe: 5, specialty: 6, guestCount: 7, guestIds: 8,
  registeredAt: 9, scanned: 10, scannedAt: 11, emailStatus: 12, qrId: 13,
} as const;

// Guests tab — normalized layout (see migrate-guests): readable, one format.
// A=id, B=parentName, C=guestIndex, D=parentId, E=scanned, F=scannedAt,
// G="Accompagnateur n°X de [Nom]" is an ARRAYFORMULA in the sheet (not written by code).
const G = {
  guestId: 0, parentName: 1, guestIndex: 2, parentId: 3,
  scanned: 4, scannedAt: 5,
} as const;

const STUDENT_HEADERS = [
  "id", "firstName", "lastName", "email", "phone",
  "classe", "specialty", "guestCount", "guestIds",
  "registeredAt", "scanned", "scannedAt", "emailStatus", "qrId",
];

const GUEST_HEADERS = [
  "ID billet", "Nom étudiant", "N° accomp.", "ID étudiant",
  "Scanné", "Scanné le",
];

// ─── Interfaces ────────────────────────────────────────────────────────────────
export interface StoredStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  classe: string;
  specialty: string;
  guestCount: number;
  guestIds: string[];
  registeredAt: string;
  scanned: boolean;
  scannedAt?: string | null;
  emailStatus: "Pending" | "Sent" | "Failed";
  qrId: string;
  _rowIndex?: number; // internal — sheet row number (1-based)
}

export interface StoredGuest {
  id: string;
  guestIndex: number;
  parentId: string;
  parentName: string;
  classe: string;
  specialty: string;
  scanned: boolean;
  scannedAt?: string | null;
  qrId: string;
  _rowIndex?: number; // internal — sheet row number (1-based)
}

// ─── Row <-> Object converters ─────────────────────────────────────────────────
function rowToStudent(row: string[], rowIndex: number): StoredStudent {
  return {
    id:            row[S.id]          || "",
    firstName:     row[S.firstName]   || "",
    lastName:      row[S.lastName]    || "",
    email:         row[S.email]       || "",
    phone:         row[S.phone]       || "",
    classe:        row[S.classe]      || "",
    specialty:     row[S.specialty]   || "",
    guestCount:    parseInt(row[S.guestCount] || "0", 10),
    guestIds:      row[S.guestIds] ? row[S.guestIds].split(",").filter(Boolean) : [],
    registeredAt:  row[S.registeredAt] || "",
    scanned:       row[S.scanned] === "TRUE",
    scannedAt:     row[S.scannedAt] || null,
    emailStatus:   (row[S.emailStatus] as StoredStudent["emailStatus"]) || "Pending",
    qrId:          row[S.qrId] || row[S.id] || "",
    _rowIndex:     rowIndex,
  };
}

function studentToRow(s: StoredStudent): string[] {
  return [
    s.id, s.firstName, s.lastName, s.email, s.phone,
    s.classe, s.specialty, String(s.guestCount),
    (s.guestIds || []).join(","),
    s.registeredAt,
    s.scanned ? "TRUE" : "FALSE",
    s.scannedAt || "",
    s.emailStatus || "Pending",
    s.qrId || s.id,
  ];
}

function rowToGuest(row: string[], rowIndex: number): StoredGuest {
  return {
    id:          row[G.guestId] || "",
    guestIndex:  parseInt(row[G.guestIndex] || "1", 10),
    parentId:    row[G.parentId] || "",
    parentName:  row[G.parentName] || "",
    classe:      "",
    specialty:   "",
    scanned:     row[G.scanned] === "TRUE",
    scannedAt:   row[G.scannedAt] || null,
    qrId:        row[G.guestId] || "",
    _rowIndex:   rowIndex,
  };
}

// Writes columns A–F only; column G ("Accompagnateur") is a sheet ARRAYFORMULA
// and must be left untouched.
function guestToRow(g: StoredGuest): string[] {
  return [
    g.id,
    g.parentName,
    String(g.guestIndex),
    g.parentId,
    g.scanned ? "TRUE" : "FALSE",
    g.scannedAt || "",
  ];
}

// ─── Header initialisation (called lazily on first write) ─────────────────────
async function ensureStudentHeaders(rows: string[][]): Promise<void> {
  if (rows.length === 0) await sheetAppendRow("Students", STUDENT_HEADERS);
}

async function ensureGuestHeaders(rows: string[][]): Promise<void> {
  if (rows.length === 0) await sheetAppendRow("Guests", GUEST_HEADERS);
}

// ─── Student CRUD ──────────────────────────────────────────────────────────────
export async function getAllStudents(): Promise<StoredStudent[]> {
  const rows = await sheetGetRows("Students");
  if (rows.length <= 1) return [];
  return rows
    .slice(1)
    .filter((row) => row[S.id])
    // row at array index i (0-based, after slice) → sheet row i + 2
    .map((row, i) => rowToStudent(row, i + 2))
    .sort((a, b) =>
      new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );
}

export async function getStudentById(id: string): Promise<StoredStudent | null> {
  const rows = await sheetGetRows("Students");
  const idx = rows.findIndex((row, i) => i > 0 && row[S.id] === id);
  if (idx === -1) return null;
  return rowToStudent(rows[idx], idx + 1); // +1: array idx to sheet row number
}

export async function getStudentByQrId(qrId: string): Promise<StoredStudent | null> {
  const rows = await sheetGetRows("Students");
  const idx = rows.findIndex((row, i) => i > 0 && row[S.qrId] === qrId);
  if (idx === -1) return null;
  return rowToStudent(rows[idx], idx + 1);
}

export async function getStudentByEmail(email: string): Promise<StoredStudent | null> {
  const rows = await sheetGetRows("Students");
  const lower = email.toLowerCase();
  const idx = rows.findIndex(
    (row, i) => i > 0 && (row[S.email] || "").toLowerCase() === lower
  );
  if (idx === -1) return null;
  return rowToStudent(rows[idx], idx + 1);
}

// ─── Duplicate detection (email OR phone OR full name) ──────────────────────────
function normEmail(e?: string): string {
  return (e || "").trim().toLowerCase();
}
// Keep only digits; Tunisian numbers are 8 digits, so compare on the last 8
// (handles "+216 28 735 769", "0028735769", "28735769" → "28735769").
function normPhone(p?: string): string {
  const d = (p || "").replace(/\D/g, "");
  return d.length > 8 ? d.slice(-8) : d;
}
/** Returns an existing student if the email OR phone already matches — else null.
 *  Name is intentionally NOT used as a criterion so real homonyms (same first+last
 *  name but different people/phones) can both register. */
export async function findDuplicateStudent(
  email: string,
  phone: string
): Promise<StoredStudent | null> {
  const students = await getAllStudents();
  const e = normEmail(email);
  const p = normPhone(phone);
  return (
    students.find(
      (s) => (!!e && normEmail(s.email) === e) || (!!p && normPhone(s.phone) === p)
    ) || null
  );
}

export async function saveStudent(student: StoredStudent): Promise<void> {
  const rows = await sheetGetRows("Students");
  await ensureStudentHeaders(rows);
  await sheetAppendRow("Students", studentToRow(student));
}

export async function updateStudent(student: StoredStudent): Promise<void> {
  if (!student._rowIndex) throw new Error("updateStudent: missing _rowIndex");
  await sheetUpdateRow("Students", student._rowIndex, studentToRow(student));
}

// ─── Guest CRUD ────────────────────────────────────────────────────────────────
export async function getGuestById(id: string): Promise<StoredGuest | null> {
  const rows = await sheetGetRows("Guests");
  const idx = rows.findIndex((row, i) => i > 0 && row[G.guestId] === id);
  if (idx === -1) return null;
  return rowToGuest(rows[idx], idx + 1);
}

export async function getGuestByQrId(qrId: string): Promise<StoredGuest | null> {
  return getGuestById(qrId);
}

export async function markGuestScanned(id: string): Promise<StoredGuest | null> {
  const guest = await getGuestById(id);
  if (!guest) return null;

  const scannedAt = new Date().toISOString();
  const updatedGuest = {
    ...guest,
    scanned: true,
    scannedAt,
  };

  await sheetUpdateRow("Guests", guest._rowIndex!, guestToRow(updatedGuest));
  return updatedGuest;
}

export async function saveGuest(guest: StoredGuest): Promise<void> {
  const rows = await sheetGetRows("Guests");
  await ensureGuestHeaders(rows);
  await sheetAppendRow("Guests", guestToRow(guest));
}

export async function updateGuest(guest: StoredGuest): Promise<void> {
  if (!guest._rowIndex) throw new Error("updateGuest: missing _rowIndex");
  await sheetUpdateRow("Guests", guest._rowIndex, guestToRow(guest));
}

export async function getAllGuests(): Promise<StoredGuest[]> {
  const rows = await sheetGetRows("Guests");
  if (rows.length <= 1) return [];
  return rows
    .slice(1)
    .filter((row) => row[G.guestId])
    // row at array index i (0-based, after slice) → sheet row i + 2
    .map((row, i) => rowToGuest(row, i + 2));
}

export async function getGuestsForStudent(guestIds: string[]): Promise<StoredGuest[]> {
  if (!guestIds || guestIds.length === 0) return [];
  const rows = await sheetGetRows("Guests");
  return rows
    .slice(1)
    .map((row, i) => rowToGuest(row, i + 2))
    .filter((g) => guestIds.includes(g.id));
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export async function getStats() {
  const [students, guestRows] = await Promise.all([
    getAllStudents(),
    sheetGetRows("Guests"),
  ]);

  const totalStudents = students.length;
  const totalGuests = students.reduce((sum, s) => sum + (s.guestCount || 0), 0);
  const totalExpected = totalStudents + totalGuests;
  const studentsCheckedIn = students.filter((s) => s.scanned).length;
  const guestsCheckedIn = guestRows.slice(1).filter(
    (row) => row[G.scanned] === "TRUE"
  ).length;

  return { totalStudents, totalGuests, totalExpected, studentsCheckedIn, guestsCheckedIn };
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export async function deleteStudent(studentId: string): Promise<void> {
  const student = await getStudentById(studentId);
  if (!student) return;

  // Find guest row indices in Guests sheet
  const guestRows = await sheetGetRows("Guests");
  const guestRowIndices = guestRows
    .map((row, i) => ({ row, sheetRow: i + 1 }))
    .filter(({ row, sheetRow }) =>
      sheetRow > 1 && (student.guestIds || []).includes(row[G.guestId])
    )
    .map(({ sheetRow }) => sheetRow);

  // Delete guests first, then the student
  if (guestRowIndices.length > 0) {
    await sheetDeleteRows("Guests", guestRowIndices);
  }
  if (student._rowIndex) {
    await sheetDeleteRows("Students", [student._rowIndex]);
  }
}
