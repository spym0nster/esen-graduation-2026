import { NextResponse } from "next/server";
import { getAllStudents } from "@/lib/rsvpService";
import { isAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

// Only graduating classes are called on stage.
const GRAD_CLASSES = ["L3", "M2"];

// Display order within each classe; anything else found in the sheet is
// appended afterward, sorted alphabetically.
const SPECIALTY_ORDER: Record<string, string[]> = {
  L3: ["BI", "BIS", "EBUS", "E-MDS"],
  M2: ["DSSD", "EBUS", "WI"],
};

const SPECIALTY_LABELS: Record<string, string> = {
  BC: "BC",
  BI: "BI",
  BIS: "BIS",
  EBUS: "E-Business",
  "EBUS (en ligne)": "E-Business (en ligne)",
  "E-MDS": "eMDS",
  DSSD: "DSSD",
  WI: "WI",
  VIC: "VIC",
  CGBI: "CGBI",
  Autre: "Autre",
};

function specialtyLabel(specialty: string): string {
  return SPECIALTY_LABELS[specialty] || specialty || "Autre";
}

function formatTime(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleTimeString("fr-TN", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Tunis" });
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const students = (await getAllStudents()).filter(
    (s) => !s.voided && GRAD_CLASSES.includes(s.classe)
  );

  const byGroup = new Map<string, typeof students>();
  for (const s of students) {
    const key = `${s.classe}|${s.specialty || "Autre"}`;
    const list = byGroup.get(key);
    if (list) list.push(s);
    else byGroup.set(key, [s]);
  }

  const keys = Array.from(byGroup.keys());
  const rank = (key: string): number => {
    const [classe, specialty] = key.split("|");
    const classeIdx = GRAD_CLASSES.indexOf(classe);
    const order = SPECIALTY_ORDER[classe] || [];
    const specIdx = order.indexOf(specialty);
    if (classeIdx === -1) return Number.MAX_SAFE_INTEGER;
    return classeIdx * 1000 + (specIdx === -1 ? 500 : specIdx);
  };
  keys.sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    return a.localeCompare(b);
  });

  const groups = keys.map((key) => {
    const [classe, specialty] = key.split("|");
    const list = byGroup.get(key)!;
    const byLastName = (a: { lastName: string }, b: { lastName: string }) =>
      a.lastName.localeCompare(b.lastName, "fr");

    const present = list
      .filter((s) => s.scanned)
      .sort(byLastName)
      .map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`.trim(),
        scannedAt: formatTime(s.scannedAt),
      }));

    const absent = list
      .filter((s) => !s.scanned)
      .sort(byLastName)
      .map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`.trim() }));

    return {
      label: `${classe} — ${specialtyLabel(specialty)}`,
      classe,
      specialty,
      present,
      absent,
    };
  });

  const totalPresent = students.filter((s) => s.scanned).length;

  return NextResponse.json({
    lastUpdated: new Date().toISOString(),
    totalPresent,
    totalStudents: students.length,
    groups,
  });
}
