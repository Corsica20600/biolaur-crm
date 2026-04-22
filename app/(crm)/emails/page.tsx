"use client";

import { useEffect, useState } from "react";
import { EmailComposer } from "@/components/emails/email-composer";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import type { EmailLog } from "@/types/crm";

type EmailRecipient = {
  id: string;
  label: string;
  email: string;
};

type EmailsPayload = {
  ok: boolean;
  error?: string;
  recipients?: EmailRecipient[];
  emailLogs?: EmailLog[];
};

export default function EmailsPage() {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEmails() {
    const response = await fetch("/api/emails/data", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as EmailsPayload | null;

    if (!payload?.ok) {
      setError(payload?.error ?? "Chargement de l'historique email impossible.");
      setLoading(false);
      return;
    }

    setRecipients(payload.recipients ?? []);
    setEmailLogs(payload.emailLogs ?? []);
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    loadEmails();
    window.addEventListener("biolaur:email-sent", loadEmails);
    return () => window.removeEventListener("biolaur:email-sent", loadEmails);
  }, []);

  const recipientById = new Map(recipients.map((recipient) => [recipient.id, recipient]));

  return (
    <>
      <PageHeader title="Emails" description="Composer, envoyer et historiser les pieces jointes commerciales." />
      <div className="mb-5">
        <EmailComposer />
      </div>
      {error ? <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {loading ? (
        <div className="rounded-lg border border-line bg-white p-4 text-sm text-slate-500">Chargement de l'historique email...</div>
      ) : (
        <DataTable<EmailLog>
          rows={emailLogs}
          searchPlaceholder="Rechercher email, client, objet..."
          searchKeys={[(row) => row.subject, (row) => row.recipientEmail, (row) => recipientById.get(row.prospectClientId ?? "")?.label]}
          filters={[
            { key: "sendStatus", label: "Statut", value: "", options: [{ label: "Envoye", value: "sent" }, { label: "Brouillon", value: "draft" }, { label: "Echec", value: "failed" }] }
          ]}
          columns={[
            { key: "sentAt", header: "Date", sortable: true, render: (row) => formatDate(row.sentAt) },
            { key: "prospectClientId", header: "Societe", render: (row) => recipientById.get(row.prospectClientId ?? "")?.label ?? "-" },
            { key: "recipientEmail", header: "Destinataire", sortable: true },
            { key: "subject", header: "Objet", sortable: true },
            { key: "attachments", header: "Pieces", render: (row) => row.attachments.length },
            { key: "sendStatus", header: "Statut", render: (row) => <StatusBadge status={row.sendStatus === "sent" ? "fait" : row.sendStatus === "failed" ? "annule" : "a_faire"} /> }
          ]}
        />
      )}
    </>
  );
}
