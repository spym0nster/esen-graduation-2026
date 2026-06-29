import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/emailService";

export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json();

    if (!to) {
      return NextResponse.json({ error: "Missing 'to' email address" }, { status: 400 });
    }

    await sendEmail({
      to,
      subject: "Test Email from ESEN Graduation 2026",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hello!</h2>
          <p>This is a test email sent using Google Workspace SMTP configuration.</p>
          <p>If you received this, the email configuration is working perfectly.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Test email sent successfully." });
  } catch (error: any) {
    console.error("Test Email Error:", error);
    return NextResponse.json(
      { error: "Failed to send test email.", details: error.message },
      { status: 500 }
    );
  }
}
