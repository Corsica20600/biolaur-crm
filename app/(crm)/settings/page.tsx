import { PageHeader } from "@/components/page-header";
import { appSettings } from "@/lib/demo-data";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Parametres" description="Societe, email expediteur, commissions, TVA et categories." />
      <form className="grid gap-5 rounded-lg border border-line bg-white p-4 md:grid-cols-2">
        <Field label="Societe" defaultValue={appSettings.companyName} />
        <Field label="Email expediteur" defaultValue={appSettings.senderEmail} />
        <Field label="Telephone" defaultValue={appSettings.senderPhone} />
        <Field label="Taux commission par defaut (%)" defaultValue={String(appSettings.defaultCommissionRate)} />
        <label className="md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Adresse</span>
          <textarea defaultValue={appSettings.companyAddress} className="focus-ring min-h-20 w-full rounded-md border border-line px-3 py-2 text-sm" />
        </label>
        <Field label="Categories clients" defaultValue="CHR, collectivite, commerce de bouche, autre" />
        <Field label="Categories produits" defaultValue="Entretien, Vaisselle, Sanitaires, Technique, Ouate" />
        <Field label="TVA" defaultValue={String(appSettings.defaultVatRate)} />
        <Field label="Logo URL" defaultValue={appSettings.logoUrl ?? ""} />
        <div className="md:col-span-2">
          <button type="button" className="focus-ring rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">Enregistrer</button>
        </div>
      </form>
    </>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input defaultValue={defaultValue} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm" />
    </label>
  );
}
