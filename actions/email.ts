"use server";

import { emailLogs } from "@/lib/demo-data";

type SendEmailInput = {
  prospectClientId: string;
  orderId?: string;
  to: string;
  subject: string;
  body: string;
  attachmentIds: string[];
};

export async function sendCrmEmail(input: SendEmailInput) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "commercial@example.com";

  if (!resendKey) {
    emailLogs.unshift({
      id: `draft-${Date.now()}`,
      ownerUserId: "demo-user",
      prospectClientId: input.prospectClientId,
      orderId: input.orderId,
      recipientEmail: input.to,
      subject: input.subject,
      body: input.body,
      attachments: input.attachmentIds.map((id) => ({
        id: `att-${id}`,
        emailLogId: `draft-${Date.now()}`,
        attachmentType: "other",
        fileName: id,
        fileUrl: id,
        createdAt: new Date().toISOString()
      })),
      sendStatus: "draft",
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return {
      ok: true,
      mode: "demo",
      message: "Email simule et historise en mode demo. Configurez RESEND_API_KEY pour l'envoi reel."
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.body
    })
  });

  if (!response.ok) {
    return { ok: false, message: "L'envoi Resend a echoue." };
  }

  return { ok: true, mode: "resend", message: "Email envoye et pret a historiser en base." };
}
