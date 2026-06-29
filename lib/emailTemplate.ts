import { RSVPEntry } from "./rsvp";

export function buildRSVPEmail(
  entry: RSVPEntry,
  studentId: string,
  studentQrId: string,
  guestIds: string[],
  guestQrIds: string[],
  studentQrDataUrl: string,
  guestQrDataUrls: string[]
): string {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://esen-graduation.vercel.app";

  let guestHtml = "";
  // Guest tickets are omitted; the PDF attachment contains all tickets.
  // No guest HTML is generated.


  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Official Invitation — ESEN Graduation Ceremony 2026</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding:20px;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          <!-- HEADER -->
          <tr>
            <td style="background:#0F2560;padding:40px;text-align:center">
              <div style="font-family:Georgia,serif;font-size:28px;color:#fff;
                          letter-spacing:3px;font-weight:700">ESEN</div>
              <div style="font-family:Georgia,serif;font-size:14px;color:#F0B429;
                          letter-spacing:4px;margin-top:6px">
                GRADUATION CEREMONY 2026
              </div>
              <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,
                          #F0B429,transparent);margin:16px auto 0"></div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:40px 48px">
              <p style="font-size:18px;color:#0F2560;font-family:Georgia,serif;margin:0 0 8px">
                Bonjour ${entry.firstName} ${entry.lastName},
              </p>
              <p style="font-size:15px;color:#444;margin:0 0 28px;line-height:1.6">
                Votre présence est confirmée pour la cérémonie de remise des diplômes ESEN 2026.<br/><br/>
                Nous sommes ravis de célébrer cette étape importante avec vous.
              </p>

              <!-- Event info pills -->
              <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:32px">
                <span style="background:#F0F4FF;border:1px solid #1B3A8C;border-radius:20px;
                             padding:6px 16px;font-size:13px;color:#0F2560;display:inline-block;margin-bottom:8px">
                  📅 Date: 9 Juillet 2026
                </span>
                <span style="background:#F0F4FF;border:1px solid #1B3A8C;border-radius:20px;
                             padding:6px 16px;font-size:13px;color:#0F2560;display:inline-block;margin-bottom:8px">
                  🕓 Heure: 16:00
                </span>
                <span style="background:#F0F4FF;border:1px solid #1B3A8C;border-radius:20px;
                             padding:6px 16px;font-size:13px;color:#0F2560;display:inline-block;margin-bottom:8px">
                  📍 Lieu: UTICA, Tunis
                </span>
              </div>

              <!-- GOLD SEPARATOR -->
              <div style="width:100%;height:1px;background:rgba(240,180,41,0.3);margin-bottom:32px;"></div>

              

              <!-- GUEST TICKETS -->
              ${guestHtml}

              <!-- WARNING BOX -->
              <div style="background:#FFF8E7;border-left:4px solid #F0B429;
                          padding:16px 20px;border-radius:4px;margin-top:32px">
                <div style="font-size:13px;color:#0F2560;font-weight:600;
                            margin-bottom:6px">⚠️ Instructions Importantes</div>
                <ul style="font-size:13px;color:#444;margin:0;padding-left:18px;
                           line-height:1.8">
                  <li>Chaque lien de billet est unique et personnel.</li>
                  <li>Ne partagez pas votre lien personnel.</li>
                  <li>Partagez uniquement le lien de l'accompagnateur avec la personne concernée — pas le vôtre.</li>
                  <li>Chaque QR code ne peut être scanné qu'une seule fois.</li>
                  <li>Conservez cet email jusqu'à la fin de l'événement.</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0F2560;padding:24px;text-align:center">
              <div style="font-size:12px;color:rgba(255,255,255,0.5);letter-spacing:1px">
                Official ESEN Graduation Ceremony 2026
              </div>
              <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:12px">
                Questions? Contact: <a href="mailto:ceremonie.graduation@esen.tn" style="color:#F0B429;text-decoration:none;">ceremonie.graduation@esen.tn</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

