import { SignJWT, importPKCS8 } from 'jose';

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

export async function getGoogleAccessToken(): Promise<string> {
  const privateKey = getPrivateKey();
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;

  const alg = 'RS256';
  const key = await importPKCS8(privateKey, alg);

  const now = Math.floor(Date.now() / 1000);

  const jwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/spreadsheets',
  })
    .setProtectedHeader({ alg, typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setIssuer(email)
    .setSubject(email)
    .setAudience('https://oauth2.googleapis.com/token')
    .sign(key);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[GoogleAuth] Token exchange failed:', errText);
    throw new Error('Failed to get Google access token');
  }

  const data = await response.json();
  return data.access_token;
}
