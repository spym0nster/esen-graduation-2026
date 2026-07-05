import { sheetGetRows, sheetAppendRow } from "./googleSheets";

export type HistoryAction =
  | "modification"
  | "annulation"
  | "suppression"
  | "renvoi"
  | "walk-in"
  | "check-in";

export interface HistoryEntry {
  date: string;
  action: HistoryAction;
  studentId: string;
  name: string;
  details: string;
}

/** Append a row to the Historique sheet tab. Never throws — audit failures
 *  must not break the caller (update / void / delete still succeed). */
export async function logHistory(entry: Omit<HistoryEntry, "date"> & { date?: string }): Promise<void> {
  const row = [
    entry.date || new Date().toISOString(),
    entry.action,
    entry.studentId || "",
    entry.name || "",
    entry.details || "",
  ];
  try {
    await sheetAppendRow("Historique", row);
  } catch (err) {
    console.error("[history] append failed:", err);
  }
}

export async function getHistory(limit = 200): Promise<HistoryEntry[]> {
  try {
    const rows = await sheetGetRows("Historique");
    if (rows.length <= 1) return [];
    const entries: HistoryEntry[] = rows
      .slice(1)
      .filter((r) => r[0])
      .map((r) => ({
        date: r[0] || "",
        action: (r[1] as HistoryAction) || "modification",
        studentId: r[2] || "",
        name: r[3] || "",
        details: r[4] || "",
      }));
    // newest first
    entries.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return entries.slice(0, limit);
  } catch {
    return [];
  }
}

/** Compute a compact "field: A → B" diff between two student objects.
 *  Only includes changed fields. Returns "" if nothing changed. */
export function diffStudent(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: readonly string[]
): string {
  const parts: string[] = [];
  for (const f of fields) {
    const b = before[f] ?? "";
    const a = after[f] ?? "";
    if (String(b) !== String(a)) parts.push(`${f}: « ${b || "∅"} » → « ${a || "∅"} »`);
  }
  return parts.join(" · ");
}
