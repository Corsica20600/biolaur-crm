import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { saveProspectClient } from "@/actions/crm";
import { ClientForm } from "@/components/forms/client-form";
import { PageHeader } from "@/components/page-header";

export default async function NewCrmRecordPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const recordType = params.type === "client" ? "client" : "prospect";

  return (
    <>
      <Link href="/crm" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-leaf">
        <ArrowLeft className="h-4 w-4" />
        Retour CRM
      </Link>
      <PageHeader
        title={recordType === "client" ? "Nouveau client" : "Nouveau prospect"}
        description="Creation d'une fiche CRM reliee a votre compte."
      />
      <ClientForm mode="create" defaultRecordType={recordType} saveProspectClient={saveProspectClient} />
    </>
  );
}
