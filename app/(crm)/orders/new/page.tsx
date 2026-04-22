import { PageHeader } from "@/components/page-header";
import { OrderForm } from "@/components/orders/order-form";

export default function NewOrderPage() {
  return (
    <>
      <PageHeader title="Nouvelle commande" description="La commande est creee uniquement depuis un client existant et des lignes tarifaires selectionnables." />
      <OrderForm />
    </>
  );
}
