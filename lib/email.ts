import "server-only";
import { ServerClient } from "postmark";

export async function sendFeedbackEmail(to: string, isMean: boolean) {
  const apiKey = process.env.POSTMARK_API_KEY;
  const fromEmail = process.env.POSTMARK_FROM_EMAIL;
  const stream = process.env.POSTMARK_MESSAGE_STREAM || "outbound";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!apiKey || !fromEmail) return;

  const client = new ServerClient(apiKey);
  const subject = "New anonymous feedback received";
  const textBody = `You received new anonymous feedback.

Click here to go to the dashboard: ${appUrl}/dashboard`;

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New anonymous feedback received</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: #faf9f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 480px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td align="center" style="padding: 40px 30px;">
                            <h1 style="color: #424133; font-size: 24px; margin: 0 0 10px;">
                                New anonymous feedback received
                            </h1>
                            
                            <p style="color: #646148; font-size: 16px; line-height: 1.5; margin: 0 0 20px; max-width: 270px">
                                Click below to view the feedback. ${
                                  isMean
                                    ? "The feedback triggered your filter, so it will be hidden in the filtered inbox until you open it."
                                    : ""
                                }
                            </p>
                            
                            <a href="${appUrl}/dashboard" style="display: inline-block; padding: 12px 28px; background-color: #646148; color: #f7f5eb; text-decoration: none; border-radius: 6px; font-size: 16px;">
                                Go to my dashboard
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

  try {
    await client.sendEmail({
      From: fromEmail,
      To: to,
      Subject: subject,
      TextBody: textBody,
      HtmlBody: htmlBody,
      MessageStream: stream,
    });
  } catch {
    // Do not fail the request if email fails
  }
}
