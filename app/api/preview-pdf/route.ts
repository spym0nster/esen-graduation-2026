import { NextResponse } from "next/server";
import { generateTicketPDF } from "@/lib/pdfGenerator";

export const runtime = "nodejs";

// TEMPORARY: preview the generated ticket PDF design with mock data. Delete after review.
export async function GET() {
  const pdf = await generateTicketPDF(
    { firstName: "Bilel", lastName: "Triki", classe: "L3", specialty: "Business Intelligence", qrId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
    [{ qrId: "b2c3d4e5-f6a7-8901-bcde-f23456789012", guestIndex: 1 }]
  );
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf" },
  });
}
