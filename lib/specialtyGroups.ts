// Shared by the live attendance page (app/api/admin/attendance) and the
// per-specialty Google Sheet sync (recordSpecialtyCheckIn below).

// Only graduating classes get their own call list / sheet tab.
export const GRAD_CLASSES = ["L3", "M2"];

export const SPECIALTY_LABELS: Record<string, string> = {
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

export function specialtyLabel(specialty: string): string {
  return SPECIALTY_LABELS[specialty] || specialty || "Autre";
}
