import { getGoogleAccessToken } from './google-auth';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

/** Read all rows from a sheet tab. Row 0 is the header. */
export async function sheetGetRows(sheetName: string): Promise<string[][]> {
  const accessToken = await getGoogleAccessToken();

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!A:N`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Sheets] Read failed:', errText);
    throw new Error('Failed to read from Google Sheet');
  }

  const data = await response.json();
  return (data.values || []) as string[][];
}

/** Append a single row to the sheet. */
export async function sheetAppendRow(sheetName: string, row: string[]): Promise<void> {
  const accessToken = await getGoogleAccessToken();

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!A:Z:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Sheets] Append failed:', errText);
    throw new Error('Failed to append to Google Sheet');
  }
}

/** Update a specific row by its 1-based sheet row number. */
export async function sheetUpdateRow(
  sheetName: string,
  rowNumber: number,
  row: string[]
): Promise<void> {
  const accessToken = await getGoogleAccessToken();

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!A${rowNumber}:N${rowNumber}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Sheets] Update failed:', errText);
    throw new Error('Failed to update Google Sheet');
  }
}

/** Delete one or more rows by their 1-based sheet row numbers. */
export async function sheetDeleteRows(sheetName: string, rowNumbers: number[]): Promise<void> {
  if (rowNumbers.length === 0) return;

  const accessToken = await getGoogleAccessToken();

  // First, get the sheet metadata to find the sheetId
  const metaResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!metaResponse.ok) {
    const errText = await metaResponse.text();
    console.error('[Sheets] Metadata fetch failed:', errText);
    throw new Error('Failed to fetch sheet metadata');
  }

  const metaData = await metaResponse.json();
  const sheet = metaData.sheets?.find((s: any) => s.properties?.title === sheetName);
  const sheetId = sheet?.properties?.sheetId;

  if (sheetId === undefined || sheetId === null) {
    console.error(`[Sheets] Sheet "${sheetName}" not found`);
    return;
  }

  // Sort descending so indices don't shift as we delete
  const sorted = [...rowNumbers].sort((a, b) => b - a);

  const requests = sorted.map((rowNum) => ({
    deleteDimension: {
      range: {
        sheetId,
        dimension: 'ROWS',
        startIndex: rowNum - 1, // 0-based (inclusive)
        endIndex: rowNum,       // 0-based (exclusive)
      },
    },
  }));

  const batchResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!batchResponse.ok) {
    const errText = await batchResponse.text();
    console.error('[Sheets] Delete failed:', errText);
    throw new Error('Failed to delete rows from Google Sheet');
  }
}

