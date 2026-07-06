// Nisse Group cold-outreach email templates.
//
// Voice matches nissegroup.com: "We don't just tell you what to automate.
// We build it." Warm, concise, not salesy. Every template returns a subject
// plus HTML and plain-text bodies (always send both for deliverability).

export interface EmailInput {
  name: string;
  companyName?: string | null;
  bookingUrl: string;
  fromName?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

const BRAND = {
  green: "#33503E",
  ink: "#1C1B18",
  muted: "#6B6C61",
  cream: "#F2EFE6",
  line: "#E3DFD3",
};

/** Wrap body HTML in a simple, email-client-safe branded shell. */
function shell(bodyHtml: string, bookingUrl: string, fromName: string): string {
  return `<!doctype html><html><body style="margin:0;background:${BRAND.cream};padding:24px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#FBFAF6;border:1px solid ${BRAND.line};border-radius:12px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
        <tr><td style="padding:22px 28px 0;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-style:italic;color:${BRAND.ink};">Nisse <span style="font-style:normal;font-size:12px;letter-spacing:2px;color:${BRAND.green};text-transform:uppercase;">Group</span></div>
        </td></tr>
        <tr><td style="padding:14px 28px 4px;color:${BRAND.ink};font-size:15px;line-height:1.55;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:12px 28px 26px;">
          <a href="${bookingUrl}" style="display:inline-block;background:${BRAND.green};color:#FBFAF6;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:8px;">Book a 15-min call →</a>
          <p style="margin:18px 0 0;color:${BRAND.muted};font-size:12px;line-height:1.5;">
            ${fromName} · Nisse Group · Vancouver, BC<br/>
            Prefer not to hear from us? Just reply “no thanks” and we’ll stop.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Initial cold outreach — the email counterpart to Sam's first call. */
export function coldOutreachEmail(input: EmailInput): RenderedEmail {
  const first = firstNameOf(input.name);
  const fromName = input.fromName ?? "Sam";
  const companyLabel = input.companyName ?? "your team";
  const companyPhrase = input.companyName ? ` at ${input.companyName}` : "";

  const subject = `Taking the busywork off ${companyLabel}'s plate`;

  const text = `Hi ${first},

I'm ${fromName} with Nisse Group in Vancouver. We build custom AI automations for small and medium businesses — the receipts, reports, follow-ups and data entry that quietly eat real hours every week.

We don't just tell you what to automate. We build it, and hand it back running.

If the same admin${companyPhrase} keeps landing on someone's desk, I'd love to show you how we'd streamline it on a quick 15-minute call: ${input.bookingUrl}

No pressure at all — if it's not a fit, no worries.

Talk soon,
${fromName}
Nisse Group · Vancouver, BC`;

  const html = shell(
    `<p style="margin:0 0 12px;">Hi ${first},</p>
     <p style="margin:0 0 12px;">I'm ${fromName} with <strong>Nisse Group</strong> in Vancouver. We build custom AI automations for small and medium businesses — the receipts, reports, follow-ups and data entry that quietly eat real hours every week.</p>
     <p style="margin:0 0 12px;">We don't just tell you what to automate. <em style="color:${BRAND.green};">We build it</em>, and hand it back running.</p>
     <p style="margin:0 0 4px;">If the same admin${companyPhrase} keeps landing on someone's desk, I'd love to show you how we'd streamline it on a quick 15-minute call.</p>`,
    input.bookingUrl,
    `${fromName}`,
  );

  return { subject, html, text };
}

/** Gentle follow-up for leads who didn't respond to the first email. */
export function followUpEmail(input: EmailInput): RenderedEmail {
  const first = firstNameOf(input.name);
  const fromName = input.fromName ?? "Sam";

  const subject = `Re: Taking the busywork off your plate`;

  const text = `Hi ${first},

Just floating this back to the top of your inbox. If freeing up a few hours of recurring admin each week would help, a 15-minute call is the fastest way to see what we'd build: ${input.bookingUrl}

If now's not the time, no problem — just let me know.

${fromName}
Nisse Group · Vancouver, BC`;

  const html = shell(
    `<p style="margin:0 0 12px;">Hi ${first},</p>
     <p style="margin:0 0 12px;">Just floating this back to the top of your inbox. If freeing up a few hours of recurring admin each week would help, a 15-minute call is the fastest way to see what we'd build.</p>
     <p style="margin:0 0 4px;">If now's not the time, no problem — just let me know.</p>`,
    input.bookingUrl,
    `${fromName}`,
  );

  return { subject, html, text };
}

/** Final touch — a graceful "closing the loop" break-up email. */
export function breakUpEmail(input: EmailInput): RenderedEmail {
  const first = firstNameOf(input.name);
  const fromName = input.fromName ?? "Sam";

  const subject = `Should I close the loop?`;

  const text = `Hi ${first},

I don't want to keep landing in your inbox, so this is my last note. If taking a few hours of recurring admin off your team's plate is worth a quick look down the road, the door's open any time: ${input.bookingUrl}

Either way, wishing you a great quarter.

${fromName}
Nisse Group · Vancouver, BC`;

  const html = shell(
    `<p style="margin:0 0 12px;">Hi ${first},</p>
     <p style="margin:0 0 12px;">I don't want to keep landing in your inbox, so this is my last note. If taking a few hours of recurring admin off your team's plate is worth a quick look down the road, the door's open any time.</p>
     <p style="margin:0 0 4px;">Either way, wishing you a great quarter.</p>`,
    input.bookingUrl,
    `${fromName}`,
  );

  return { subject, html, text };
}

export type EmailTemplate = "cold_outreach" | "follow_up" | "break_up";

export function renderTemplate(
  template: EmailTemplate,
  input: EmailInput,
): RenderedEmail {
  if (template === "follow_up") return followUpEmail(input);
  if (template === "break_up") return breakUpEmail(input);
  return coldOutreachEmail(input);
}
