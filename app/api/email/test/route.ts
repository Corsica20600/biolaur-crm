import { NextResponse } from "next/server";

function parseEmailFrom(value?: string) {
  if (!value) return "";
  const match = value.match(/<([^>]+)>/);
  return match?.[1] ?? value;
}

export async function POST(request: Request) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = parseEmailFrom(process.env.EMAIL_FROM);
  const senderName = process.env.EMAIL_FROM_NAME ?? "Biolaur CRM";
  const body = (await request.json().catch(() => ({}))) as { to?: string; subject?: string };
  const recipientEmail = body.to;

  if (!brevoApiKey) {
    return NextResponse.json({ ok: false, error: "BREVO_API_KEY manquant dans .env.local" }, { status: 400 });
  }

  if (!senderEmail) {
    return NextResponse.json({ ok: false, error: "EMAIL_FROM manquant dans .env.local" }, { status: 400 });
  }

  if (!recipientEmail) {
    return NextResponse.json({ ok: false, error: "Champ JSON requis: to" }, { status: 400 });
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoApiKey,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: recipientEmail }],
      subject: body.subject ?? "Test email Biolaur CRM",
      htmlContent:
        "<p>Bonjour,</p><p>Ceci est un email de test envoye depuis Biolaur CRM via Brevo.</p><p>Cordialement</p>",
      textContent: "Bonjour,\n\nCeci est un email de test envoye depuis Biolaur CRM via Brevo.\n\nCordialement"
    })
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: response.status,
        error: "Echec de l'envoi Brevo",
        details: payload
      },
      { status: response.status }
    );
  }

  return NextResponse.json({
    ok: true,
    provider: "brevo",
    from: { email: senderEmail, name: senderName },
    to: recipientEmail,
    brevo: payload
  });
}
