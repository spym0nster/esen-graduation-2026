import { sheetGetRows, sheetAppendRow, ensureSheetExists } from "./googleSheets";
import { GRAD_CLASSES, specialtyLabel } from "./specialtyGroups";

// Best-effort per-instance cache: skip the metadata check once we've already
// confirmed/created a tab this server instance. Matches the caching pattern
// used elsewhere in this codebase (e.g. rsvpService's voided-ids cache).
const knownTabs = new Set<string>();

function tabNameFor(classe: string, specialty: string): string {
  return `${classe} ${specialtyLabel(specialty)}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-TN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Tunis",
  });
}

/** Append a "present" row (#order, name, time) to the classe/specialty's own
 *  sheet tab (e.g. "L3 BI") when a graduating student (L3/M2) checks in.
 *  Never throws — a failure here must not affect the actual check-in. */
export async function recordSpecialtyCheckIn(
  classe: string,
  specialty: string,
  name: string,
  scannedAtIso: string
): Promise<void> {
  if (!GRAD_CLASSES.includes(classe)) return;
  const tab = tabNameFor(classe, specialty || "Autre");

  try {
    if (!knownTabs.has(tab)) {
      await ensureSheetExists(tab);
      knownTabs.add(tab);
    }
    const rows = await sheetGetRows(tab);
    const order = rows.length + 1;
    await sheetAppendRow(tab, [`#${order}`, name, formatTime(scannedAtIso)]);
  } catch (err) {
    console.error(`[specialtySheets] failed to record "${name}" in "${tab}":`, err);
  }
}
