"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AppSettings } from "@/types/crm";

export type SettingsSaveState = {
  ok: boolean;
  message: string;
};

type SettingsFormProps = {
  settings: Pick<
    AppSettings,
    "companyName" | "senderName" | "senderEmail" | "senderPhone" | "companyAddress" | "logoUrl" | "defaultCommissionRate" | "defaultVatRate" | "currency"
    | "clientCategories" | "productCategories"
  >;
  saveSettings: (previousState: SettingsSaveState, formData: FormData) => Promise<SettingsSaveState>;
};

const initialState: SettingsSaveState = { ok: false, message: "" };

export function SettingsForm({ settings, saveSettings }: SettingsFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveSettings, initialState);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [router, state.ok]);

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-line bg-white p-4 md:grid-cols-2">
      <Field name="companyName" label="Societe" defaultValue={settings.companyName} />
      <input type="hidden" name="senderName" defaultValue={settings.senderName} />
      <input type="hidden" name="currency" defaultValue={settings.currency} />
      <Field name="senderEmail" label="Email expediteur" defaultValue={settings.senderEmail} />
      <Field name="senderPhone" label="Telephone" defaultValue={settings.senderPhone} />
      <Field name="defaultCommissionRate" label="Taux commission par defaut (%)" defaultValue={String(settings.defaultCommissionRate)} />
      <label className="md:col-span-2">
        <span className="mb-1 block text-sm font-medium text-slate-700">Adresse</span>
        <textarea
          name="companyAddress"
          defaultValue={settings.companyAddress}
          className="focus-ring min-h-20 w-full rounded-md border border-line px-3 py-2 text-sm"
        />
      </label>
      <Field name="clientCategories" label="Categories clients" defaultValue={settings.clientCategories ?? "CHR, collectivite, commerce de bouche, autre"} />
      <Field name="productCategories" label="Categories produits" defaultValue={settings.productCategories ?? "Entretien, Vaisselle, Sanitaires, Technique, Ouate"} />
      <Field name="defaultVatRate" label="TVA" defaultValue={String(settings.defaultVatRate)} />
      <Field name="logoUrl" label="Logo URL" defaultValue={settings.logoUrl ?? ""} />
      <div className="md:col-span-2">
        <button type="submit" disabled={pending} className="focus-ring rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "Enregistrement..." : "Enregistrer"}
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

function Field({ label, defaultValue, name }: { label: string; defaultValue: string; name?: string }) {
  return (
    <label>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input name={name} defaultValue={defaultValue} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm" />
    </label>
  );
}
