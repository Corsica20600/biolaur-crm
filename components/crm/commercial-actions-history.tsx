"use client";

import { useActionState, useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import type { UpdateCommercialActionStatusState } from "@/actions/crm";
import type { CommercialAction } from "@/types/crm";

type ActionRow = CommercialAction;

function cleanAutoKey(text?: string) {
  if (!text) return "";
  return text
    .split("\n")
    .filter((line) => !line.trim().startsWith("AUTO_KEY:"))
    .join("\n")
    .replace(/AUTO_KEY:[^\s\n]+/g, "")
    .trim();
}

const initialStatusState: UpdateCommercialActionStatusState = { ok: false, message: "" };

export function CommercialActionsHistory({
  actions,
  prospectClientId,
  updateCommercialActionStatus
}: {
  actions: ActionRow[];
  prospectClientId: string;
  updateCommercialActionStatus: (
    previousState: UpdateCommercialActionStatusState,
    formData: FormData
  ) => Promise<UpdateCommercialActionStatusState>;
}) {
  const [rows, setRows] = useState<ActionRow[]>(actions);
  const [statusFilter, setStatusFilter] = useState<"all" | "a_faire" | "fait" | "annule">("all");
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string>("");
  const [state, formAction, pending] = useActionState(updateCommercialActionStatus, initialStatusState);

  useEffect(() => {
    setRows(actions);
  }, [actions]);

  useEffect(() => {
    if (!state.message) return;
    setFeedback({ ok: state.ok, message: state.message });
    const nextStatus = state.status;
    if (state.ok && state.actionId && nextStatus) {
      setRows((current) =>
        current.map((item) =>
          item.id === state.actionId
            ? {
                ...item,
                actionStatus: nextStatus
              }
            : item
        )
      );
    }
  }, [state]);

  useEffect(() => {
    if (!pending) {
      setPendingActionId("");
    }
  }, [pending]);

  const visibleRows = rows.filter((action) => (statusFilter === "all" ? true : action.actionStatus === statusFilter));

  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <h2 className="mb-3 font-semibold text-ink">Actions commerciales</h2>
      {feedback ? (
        <p className={`mb-3 rounded-md px-3 py-2 text-sm ${feedback.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {feedback.message}
        </p>
      ) : null}
      <div className="mb-4">
        <p className="text-sm text-slate-500">Traitez les relances en cours et mettez a jour leur statut.</p>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${statusFilter === "all" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line text-slate-600 hover:bg-slate-50"}`}
        >
          Toutes
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("a_faire")}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${statusFilter === "a_faire" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-line text-slate-600 hover:bg-slate-50"}`}
        >
          A faire
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("fait")}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${statusFilter === "fait" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line text-slate-600 hover:bg-slate-50"}`}
        >
          Fait
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("annule")}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${statusFilter === "annule" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-line text-slate-600 hover:bg-slate-50"}`}
        >
          Annulees
        </button>
      </div>
      <div className="space-y-3">
        {visibleRows.map((action) => {
          const summary = cleanAutoKey(action.summary) || "Action commerciale";
          const details = cleanAutoKey(action.details);
          const isDisabled = pending && pendingActionId === action.id;

          return (
            <article key={action.id} className="rounded-xl border border-line bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{summary}</p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-slate-600">{action.actionType}</span>
                  <StatusBadge status={action.actionStatus} />
                  {action.actionStatus === "a_faire" && action.nextActionDate ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                      Prochaine relance
                    </span>
                  ) : null}
                </div>
              </div>
              {details ? <p className="mt-2 text-sm text-slate-600">{details}</p> : null}
              <div className="mt-2 grid gap-1 text-xs text-slate-500 md:grid-cols-2">
                <p>Date action: {formatDate(action.actionDate)}</p>
                <p>Prochaine relance: {formatDate(action.nextActionDate)}</p>
              </div>
              <form action={formAction} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="actionId" value={action.id} />
                <input type="hidden" name="prospectClientId" value={prospectClientId} />
                <button
                  type="submit"
                  name="status"
                  value="fait"
                  disabled={isDisabled}
                  onClick={() => setPendingActionId(action.id)}
                  className="rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDisabled ? "Mise a jour..." : "Marquer fait"}
                </button>
                <button
                  type="submit"
                  name="status"
                  value="a_faire"
                  disabled={isDisabled}
                  onClick={() => setPendingActionId(action.id)}
                  className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reporter
                </button>
                <button
                  type="submit"
                  name="status"
                  value="annule"
                  disabled={isDisabled}
                  onClick={() => setPendingActionId(action.id)}
                  className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Annuler
                </button>
              </form>
            </article>
          );
        })}
        {!visibleRows.length ? <p className="text-sm text-slate-500">Aucune action pour ce filtre.</p> : null}
      </div>
    </section>
  );
}
