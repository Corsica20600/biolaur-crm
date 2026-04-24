import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/forms/product-form";
import { PageHeader } from "@/components/page-header";

export default function NewProductPage() {
  return (
    <>
      <Link href="/products" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-leaf">
        <ArrowLeft className="h-4 w-4" />
        Retour catalogue
      </Link>
      <PageHeader title="Nouveau produit" description="Creation rapide d'un produit dans le catalogue." />
      <ProductForm />
    </>
  );
}
