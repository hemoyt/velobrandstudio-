/**
 * Optional email sending for team invites. Self-hosters aren't required to
 * configure this — the invite link is always returned from the API/UI so an
 * admin can copy/paste it manually. If RESEND_API_KEY is set, we additionally
 * email it via Resend's HTTP API (no SDK dependency).
 */
export async function sendInviteEmail(params: { to: string; teamName: string; inviteUrl: string; invitedByEmail: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(`[invite] No RESEND_API_KEY configured. Share this link with ${params.to} manually: ${params.inviteUrl}`);
    return { sent: false as const };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.INVITE_FROM_EMAIL || 'VeloBrand Studio <onboarding@resend.dev>',
      to: params.to,
      subject: `${params.invitedByEmail} invited you to ${params.teamName} on VeloBrand Studio`,
      html: `<p>${params.invitedByEmail} invited you to join <strong>${params.teamName}</strong> on VeloBrand Studio.</p><p><a href="${params.inviteUrl}">Accept the invite</a></p>`,
    }),
  });

  if (!res.ok) {
    console.error('Failed to send invite email via Resend', await res.text().catch(() => ''));
    return { sent: false as const };
  }
  return { sent: true as const };
}
