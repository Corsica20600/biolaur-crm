"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { CreateCommercialActionState } from "@/actions/crm";

const initialState: CreateCommercialActionState = { ok: false, message: "" };

export function CommercialActionForm({
  prospectClientId,
  createCommercialAction
}: {
  prospectClientId: string;
  createCommercialAction: (
    previousState: CreateCommercialActionState,
    formData: FormData
  ) => Promise<CreateCommercialActionState>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createCommercialAction, initialState);

  useEffect(() => {
    if (!state.ok || !formRef.current) return;
    formRef.current.reset();
    router.refresh();
  }, [router, state.ok]);

  return (
    <form ref={formRef} action={formAction} className="rounded-lg border border-line bg-white p-4">
      <input type="hidden" name="prospectClientId" value={prospectClientId} />
      <div className="grid gap-3 md:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-medium text-slate-700">Type d&apos;action</span>
          <select name="actionType" defaultValue="appel" className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm">
            <option value="appel">Appel</option>
            <option value="visite">Visite</option>
            <option value="relance">Relance</option>
            <option value="email">Email</option>
            <option value="rendez_vous">Rendez-vous</option>
            <option value="note">Note</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-slate-700">Statut</span>
          <select name="actionStatus" defaultValue="a_faire" className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm">
            <option value="a_faire">A faire</option>
            <option value="fait">Fait</option>
            <option value="annule">Annule</option>
          </select>
        </label>
        <label className="md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Resume</span>
          <input name="summary" required className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm" />
        </label>
        <label className="md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Details</span>
          <textarea name="details" className="focus-ring min-h-20 w-full rounded-md border border-line px-3 py-2 text-sm" />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-slate-700">Date action</span>
          <input type="datetime-local" name="actionDate" className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm" />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-slate-700">Prochaine relance</span>
          <input type="datetime-local" name="nextActionDate" className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm" />
        </label>
      </div>
      <div className="mt-3">
        <button
          type="submit"
          disabled={pending}
          className="focus-ring rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Ajout..." : "Ajouter l'action"}
        </button>
        {state.message ? (
          <p className={`mt-3 text-sm font-medium ${state.ok ? "text-leaf" : "text-red-600"}`} role="status">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
