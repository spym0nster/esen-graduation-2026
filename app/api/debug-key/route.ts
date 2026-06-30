export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';

  let processed = raw.trim();
  if ((processed.startsWith('"') && processed.endsWith('"'))) {
    processed = processed.slice(1, -1);
  }
  processed = processed.replace(/\\n/g, '\n').replace(/\r/g, '').trim();

  return NextResponse.json({
    rawLength: raw.length,
    rawFirst40: raw.substring(0, 40),
    rawLast40: raw.substring(raw.length - 40),
    hasLiteralBackslashN: raw.includes('\\n'),
    hasActualNewline: raw.includes('\n'),
    processedLength: processed.length,
    processedFirst40: processed.substring(0, 40),
    processedLast40: processed.substring(processed.length - 40),
    hasBegin: processed.includes('-----BEGIN PRIVATE KEY-----'),
    hasEnd: processed.includes('-----END PRIVATE KEY-----'),
    lineCount: processed.split('\n').length,
    runtimeUsed: process.env.NEXT_RUNTIME || 'unknown',
  });
}
