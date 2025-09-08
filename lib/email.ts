import { ServerClient } from "postmark";

export async function sendFeedbackEmail(to: string, isMean: boolean) {
  const apiKey = process.env.POSTMARK_API_KEY;
  const fromEmail = process.env.POSTMARK_FROM_EMAIL;
  const stream = process.env.POSTMARK_MESSAGE_STREAM || "outbound";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!apiKey || !fromEmail) return;

  const client = new ServerClient(apiKey);
  const subject = "New anonymous feedback received";
  const textBody = isMean
    ? `You received anonymous feedback that was tagged as potentially mean/unhelpful.

Click here to go to the dashboard: ${appUrl}/dashboard

The feedback will be hidden in the filtered inbox until you open it.
`
    : `You received new anonymous feedback.

View in your inbox: ${appUrl}/dashboard`;

  try {
    await client.sendEmail({
      From: fromEmail,
      To: to,
      Subject: subject,
      TextBody: textBody,
      MessageStream: stream,
    });
  } catch {
    // Do not fail the request if email fails
  }
}
