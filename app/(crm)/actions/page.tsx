"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import type { CommercialAction } from "@/types/crm";

type ActionRow = CommercialAction & { clientName?: string };
type AutomationCampaign = {
  key: string;
  title: string;
  status: "brouillon";
  targetCount: number;
  subject: string;
  message: string;
};
type AutomationStats = {
  createdCount: number;
  skippedExistingCount?: number;
  skippedDuplicateCount?: number;
  skippedMissingClientCount?: number;
  skippedInsertErrorCount?: number;
  skippedOptOutCount: number;
  generatedAt: string;
};
type ActionsPayload = {
  ok: boolean;
  actions?: ActionRow[];
  campaigns?: AutomationCampaign[];
  automation?: AutomationStats;
  error?: string;
};

export default function ActionsPage() {
  const [rows, setRows] = useState<ActionRow[]>([]);
  const [campaigns, setCampaigns] = useState<AutomationCampaign[]>([]);
  const [automationStats, setAutomationStats] = useState<AutomationStats | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  async function loadActions() {
    try {
      const response = await fetch("/api/actions", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as ActionsPayload | null;
      console.log("SUPABASE DATA:", payload?.actions);
      console.log("SUPABASE ERROR:", !response.ok ? payload?.error : null);
      if (!response.ok || !payload?.ok) {
        if (!response.ok) {
          console.error("SUPABASE FULL ERROR:", payload?.error);
        }
        setError(payload?.error || "Chargement actions impossible");
        return;
      }
      setRows(payload.actions ?? []);
      setCampaigns(payload.campaigns ?? []);
      setAutomationStats(payload.automation ?? null);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement actions impossible");
    }
  }

  async function generateActions() {
    setIsGenerating(true);
    const response = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "generate" })
    });
    const payload = (await response.json().catch(() => null)) as ActionsPayload | null;
    if (!response.ok || !payload?.ok) {
      setError(payload?.error ?? "Generation automatique impossible.");
      setIsGenerating(false);
      return;
    }
    setCampaigns(payload.campaigns ?? []);
    setAutomationStats(payload.automation ?? null);
    await loadActions();
    setIsGenerating(false);
  }

  useEffect(() => {
    loadActions();
  }, []);

  return (
    <>
      <PageHeader
        title="Actions commerciales"
        description="Relances, visites, appels et notes de suivi chronologiques."
        actions={
          <button
            type="button"
            onClick={generateActions}
            disabled={isGenerating}
            className="focus-ring rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? "Generation..." : "Generer les actions automatiques"}
          </button>
        }
      />
      {error ? <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {automationStats ? (
        <div className="mb-4 rounded-md border border-line bg-white p-3 text-sm text-slate-700">
          {automationStats.createdCount > 0 ? (
            <>
              <span className="font-medium">{automationStats.createdCount} actions generees</span>
              {(automationStats.skippedMissingClientCount ?? 0) + (automationStats.skippedInsertErrorCount ?? 0) > 0 ? (
                <> - {(automationStats.skippedMissingClientCount ?? 0) + (automationStats.skippedInsertErrorCount ?? 0)} clients ignores (donnees incompletes)</>
              ) : null}
            </>
          ) : (
            <>Aucune action generee</>
          )}
        </div>
      ) : null}
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Campagnes automatiques</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <article key={campaign.key} className="rounded-xl border border-line p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-ink">{campaign.title}</p>
                <StatusBadge status="a_faire" />
              </div>
              <p className="text-sm text-slate-600">Cible: {campaign.targetCount} contacts</p>
              <p className="mt-2 text-sm font-medium text-slate-700">{campaign.subject}</p>
              <p className="mt-1 text-sm text-slate-600">{campaign.message}</p>
            </article>
          ))}
          {!campaigns.length ? <p className="text-sm text-slate-500">Aucune campagne automatique disponible.</p> : null}
        </div>
      </section>
      <DataTable<ActionRow>
        rows={rows}
        searchPlaceholder="Rechercher action, client, resume..."
        searchKeys={[(row) => row.summary, (row) => row.details, (row) => row.clientName]}
        filters={[
          {
            key: "actionType",
            label: "Type",
            value: "",
            options: [
              { label: "Appel", value: "appel" },
              { label: "Visite", value: "visite" },
              { label: "Relance", value: "relance" },
              { label: "Email", value: "email" },
              { label: "Reassort", value: "reassort" },
              { label: "Prospection", value: "prospection" }
            ]
          },
          { key: "actionStatus", label: "Statut", value: "", options: [{ label: "A faire", value: "a_faire" }, { label: "Fait", value: "fait" }, { label: "Annule", value: "annule" }] }
        ]}
        columns={[
          { key: "actionDate", header: "Date", sortable: true, render: (row) => formatDate(row.actionDate) },
          { key: "clientName", header: "Societe", render: (row) => row.clientName ?? "-" },
          { key: "actionType", header: "Type", sortable: true },
          { key: "summary", header: "Resume" },
          { key: "nextActionDate", header: "Prochaine", sortable: true, render: (row) => formatDate(row.nextActionDate) },
          { key: "actionStatus", header: "Statut", render: (row) => <StatusBadge status={row.actionStatus} /> }
        ]}
      />
    </>
  );
}
