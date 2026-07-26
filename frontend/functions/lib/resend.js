// fetch()-based Resend REST client, replacing the `resend` npm SDK.
// Docs: https://resend.com/docs/api-reference/emails/send-email

async function sendEmail(env, { to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || 'Failed to send email via Resend');
  }
  return res.json();
}

export { sendEmail };
