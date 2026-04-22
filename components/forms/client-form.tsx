"use client";

import type { ProspectClient } from "@/types/crm";

export function ClientForm({ record, mode = "create" }: { record?: ProspectClient; mode?: "create" | "edit" }) {
  return (
    <form className="grid gap-4 rounded-lg border border-line bg-white p-4 md:grid-cols-2">
      <Field label="Type" name="recordType" defaultValue={record?.recordType ?? "prospect"} as="select">
        <option value="prospect">Prospect</option>
        <option value="client">Client</option>
      </Field>
      <Field label="Type client" name="clientType" defaultValue={record?.clientType ?? "CHR"} as="select">
        <option value="CHR">CHR</option>
        <option value="collectivite">Collectivite</option>
        <option value="commerce_de_bouche">Commerce de bouche</option>
        <option value="autre">Autre</option>
      </Field>
      <Field label="Raison sociale" name="companyName" defaultValue={record?.companyName} />
      <Field label="Nom commercial" name="tradeName" defaultValue={record?.tradeName} />
      <Field label="Prenom contact" name="contactFirstName" defaultValue={record?.contactFirstName} />
      <Field label="Nom contact" name="contactLastName" defaultValue={record?.contactLastName} />
      <Field label="Telephone" name="phone" defaultValue={record?.phone} />
      <Field label="Mobile" name="mobile" defaultValue={record?.mobile} />
      <Field label="Email" name="email" defaultValue={record?.email} />
      <Field label="Ville" name="city" defaultValue={record?.city} />
      <Field label="Secteur" name="geographicSector" defaultValue={record?.geographicSector} />
      <Field label="Statut" name="commercialStatus" defaultValue={record?.commercialStatus ?? "a_prospecter"} as="select">
        <option value="a_prospecter">A prospecter</option>
        <option value="en_cours">En cours</option>
        <option value="relance">Relance</option>
        <option value="gagne">Gagne</option>
        <option value="perdu">Perdu</option>
        <option value="actif">Actif</option>
        <option value="inactif">Inactif</option>
      </Field>
      <label className="md:col-span-2">
        <span className="mb-1 block text-sm font-medium text-slate-700">Notes commerciales</span>
        <textarea name="notes" defaultValue={record?.notes} className="focus-ring min-h-24 w-full rounded-md border border-line px-3 py-2 text-sm" />
      </label>
      <div className="md:col-span-2">
        <button type="button" className="focus-ring rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">
          {mode === "edit" ? "Enregistrer la fiche" : "Creer la fiche"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  as,
  children
}: {
  label: string;
  name: string;
  defaultValue?: string;
  as?: "select";
  children?: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {as === "select" ? (
        <select name={name} defaultValue={defaultValue} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm">
          {children}
        </select>
      ) : (
        <input name={name} defaultValue={defaultValue} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm" />
      )}
    </label>
  );
}
