"use client";

import { EmailComposer } from "@/components/emails/email-composer";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { emailLogs, prospectsClients } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";
import type { EmailLog } from "@/types/crm";

export default function EmailsPage() {
  return (
    <>
      <PageHeader title="Emails" description="Composer, envoyer et historiser les pieces jointes commerciales." />
      <div className="mb-5">
        <EmailComposer />
      </div>
      <DataTable<EmailLog>
        rows={emailLogs}
        searchPlaceholder="Rechercher email, client, objet..."
        searchKeys={[(row) => row.subject, (row) => row.recipientEmail, (row) => prospectsClients.find((record) => record.id === row.prospectClientId)?.tradeName]}
        filters={[
          { key: "sendStatus", label: "Statut", value: "", options: [{ label: "Envoye", value: "sent" }, { label: "Brouillon", value: "draft" }, { label: "Echec", value: "failed" }] }
        ]}
        columns={[
          { key: "sentAt", header: "Date", sortable: true, render: (row) => formatDate(row.sentAt) },
          { key: "prospectClientId", header: "Societe", render: (row) => prospectsClients.find((record) => record.id === row.prospectClientId)?.tradeName },
          { key: "recipientEmail", header: "Destinataire", sortable: true },
          { key: "subject", header: "Objet", sortable: true },
          { key: "attachments", header: "Pieces", render: (row) => row.attachments.length },
          { key: "sendStatus", header: "Statut", render: (row) => <StatusBadge status={row.sendStatus === "sent" ? "fait" : row.sendStatus === "failed" ? "annule" : "a_faire"} /> }
        ]}
      />
    </>
  );
}
