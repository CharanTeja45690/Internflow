export async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_HOST) {
    console.log(`[email:dev] to=${to} subject=${subject} text=${text}`);
    return { queued: false, dev: true };
  }
  // Production deployments can wire this function to an SMTP provider or email API.
  console.log(`[email:queued] to=${to} subject=${subject}`);
  return { queued: true };
}
