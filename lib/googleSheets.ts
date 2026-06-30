import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;

function getPrivateKey(): string {
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "";
  key = key.trim();

  if (key.startsWith("\"") && key.endsWith("\"")) {
    key = key.slice(1, -1);
  }

  key = key.replace(/\\n/g, "\n");

  if (
    !key.includes("-----BEGIN PRIVATE KEY-----") ||
    !key.includes("-----END PRIVATE KEY-----")
  ) {
    console.error(
      "[GoogleAuth] Invalid key format. First 50 chars:",
      key.substring(0, 50)
    );
    console.error("[GoogleAuth] Key length:", key.length);
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is malformed — missing BEGIN/END markers"
    );
  }

  return key;
}

async function createAuth() {
  try {
    const auth = new google.auth.JWT({
      email: CLIENT_EMAIL,
      key: getPrivateKey(),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    await auth.authorize();
    return auth;
  } catch (err) {
    console.error("[GoogleAuth] Authorization failed:", err);
    throw err;
  }
}

async function getSheets() {
  const auth = await createAuth();
  return google.sheets({ version: "v4", auth });
}

/** Read all rows from a sheet tab. Row 0 is the header. */
export async function sheetGetRows(sheetName: string): Promise<string[][]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:N`,
  });
  return (res.data.values || []) as string[][];
}

/** Append a single row to the sheet. */
export async function sheetAppendRow(sheetName: string, row: string[]): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:A`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

/** Update a specific row by its 1-based sheet row number. */
export async function sheetUpdateRow(
  sheetName: string,
  rowNumber: number,
  row: string[]
): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${rowNumber}:N${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

/** Delete one or more rows by their 1-based sheet row numbers. */
export async function sheetDeleteRows(sheetName: string, rowNumbers: number[]): Promise<void> {
  if (rowNumbers.length === 0) return;
  const sheets = await getSheets();

  // Fetch the internal sheetId (not the same as the spreadsheet ID)
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === sheetName);
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) return;

  // Sort descending so indices don't shift as we delete
  const sorted = [...rowNumbers].sort((a, b) => b - a);

  const requests = sorted.map((rowNum) => ({
    deleteDimension: {
      range: {
        sheetId,
        dimension: "ROWS" as const,
        startIndex: rowNum - 1, // 0-based (inclusive)
        endIndex: rowNum,       // 0-based (exclusive)
      },
    },
  }));

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests },
  });
}
