import { del } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import { sheetGetRows, sheetAppendRow, sheetDeleteRows } from "./googleSheets";

export type MediaType = "wall" | "gallery";

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  caption: string;
  author: string;
  createdAt: string;
  _rowIndex?: number;
}

// Media tab columns
const M = { id: 0, type: 1, url: 2, caption: 3, author: 4, createdAt: 5 } as const;
const TAB = "Media";

export async function addMedia(
  type: MediaType,
  url: string,
  caption: string,
  author: string
): Promise<MediaItem> {
  const item: MediaItem = {
    id: uuidv4(),
    type,
    url,
    caption,
    author,
    createdAt: new Date().toISOString(),
  };
  await sheetAppendRow(TAB, [item.id, item.type, item.url, item.caption, item.author, item.createdAt]);
  return item;
}

export async function getMedia(type?: MediaType): Promise<MediaItem[]> {
  let rows: string[][] = [];
  try {
    rows = await sheetGetRows(TAB);
  } catch {
    return [];
  }
  if (rows.length <= 1) return [];
  const items = rows
    .slice(1)
    .filter((r) => r[M.id] && r[M.url])
    .map((r, i) => ({
      id: r[M.id],
      type: (r[M.type] as MediaType) || "wall",
      url: r[M.url],
      caption: r[M.caption] || "",
      author: r[M.author] || "",
      createdAt: r[M.createdAt] || "",
      _rowIndex: i + 2,
    }));
  const filtered = type ? items.filter((x) => x.type === type) : items;
  // newest first (ISO timestamps sort lexicographically)
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteMedia(id: string): Promise<void> {
  const rows = await sheetGetRows(TAB);
  const idx = rows.findIndex((r, i) => i > 0 && r[M.id] === id);
  if (idx === -1) return;
  const url = rows[idx][M.url];
  if (url) {
    try { await del(url); } catch { /* blob may already be gone */ }
  }
  await sheetDeleteRows(TAB, [idx + 1]); // idx is 0-based array → 1-based sheet row
}
