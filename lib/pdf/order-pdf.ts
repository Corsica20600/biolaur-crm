import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createAdminClient } from "@/supabase/admin";

type DbRow = Record<string, unknown>;

function readOrderField(row: DbRow, canonical: string, legacy?: string) {
  if (row[canonical] !== undefined && row[canonical] !== null) return row[canonical];
  if (legacy && row[legacy] !== undefined && row[legacy] !== null) return row[legacy];
  return undefined;
}

async function findOrder(
  supabase: ReturnType<typeof createAdminClient>,
  orderIdOrNumber: string,
  ownerUserId?: string
) {
  const ownerFilter = ownerUserId ? { owner_user_id: ownerUserId } : {};
  const byId = await supabase.from("orders").select("*").eq("id", orderIdOrNumber).match(ownerFilter).maybeSingle();
  if (!byId.error && byId.data) return { row: byId.data as DbRow, error: null as null };

  const byOrderNumber = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderIdOrNumber)
    .match(ownerFilter)
    .maybeSingle();
  if (!byOrderNumber.error && byOrderNumber.data) return { row: byOrderNumber.data as DbRow, error: null as null };

  const byNumeroCommande = await supabase
    .from("orders")
    .select("*")
    .eq("numero_commande", orderIdOrNumber)
    .match(ownerFilter)
    .maybeSingle();
  if (!byNumeroCommande.error && byNumeroCommande.data) return { row: byNumeroCommande.data as DbRow, error: null as null };

  return {
    row: null,
    error: byId.error ?? byOrderNumber.error ?? byNumeroCommande.error ?? { message: "Commande introuvable." }
  };
}

export async function createOrderPdf(orderId: string, ownerUserId?: string) {
  const supabase = createAdminClient();
  const { row: dbOrder, error: orderError } = await findOrder(supabase, orderId, ownerUserId);

  if (orderError || !dbOrder) {
    throw new Error(orderError?.message ?? "Commande introuvable.");
  }

  const resolvedOrderId = String(dbOrder.id ?? "");
  const { data: dbItems, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", resolvedOrderId)
    .match(ownerUserId ? { owner_user_id: ownerUserId } : {})
    .order("sort_order");

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const order = dbOrder as DbRow;
  const prospectClientId = String(readOrderField(order, "prospect_client_id", "client_id") ?? "");
  const { data: dbProspectClient, error: prospectClientError } = prospectClientId
    ? await supabase.from("prospects_clients").select("*").eq("id", prospectClientId).single()
    : { data: null, error: null };
  if (prospectClientError) {
    throw new Error(prospectClientError.message);
  }

  const client = (dbProspectClient ?? {}) as DbRow;
  const items = (dbItems ?? []) as DbRow[];

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const green = rgb(0.12, 0.48, 0.32);
  const dark = rgb(0.09, 0.13, 0.11);

  page.drawText("Biolaur Distribution", { x: 48, y: 790, size: 20, font: bold, color: green });
  page.drawText("Bon de commande", { x: 48, y: 760, size: 28, font: bold, color: dark });
  page.drawText(String(readOrderField(order, "order_number", "numero_commande") ?? ""), { x: 48, y: 730, size: 13, font, color: dark });
  page.drawText(`Date: ${formatDate(String(readOrderField(order, "order_date", "date_commande") ?? ""))}`, { x: 420, y: 730, size: 11, font, color: dark });

  page.drawText("Client", { x: 48, y: 680, size: 13, font: bold, color: dark });
  page.drawText(String(client.trade_name ?? client.company_name ?? "Client"), { x: 48, y: 660, size: 11, font, color: dark });
  page.drawText(
    `${String(client.address_line_1 ?? "")}, ${String(client.postal_code ?? "")} ${String(client.city ?? "")}`,
    { x: 48, y: 644, size: 10, font, color: dark }
  );
  page.drawText(
    `Livraison: ${String(readOrderField(order, "delivery_address_line_1", "adresse_livraison") ?? "")}, ${String(order.delivery_postal_code ?? "")} ${String(order.delivery_city ?? "")}`,
    { x: 48, y: 618, size: 10, font, color: dark }
  );

  const startY = 570;
  page.drawText("Ref.", { x: 48, y: startY, size: 10, font: bold });
  page.drawText("Designation", { x: 130, y: startY, size: 10, font: bold });
  page.drawText("Qte", { x: 365, y: startY, size: 10, font: bold });
  page.drawText("PU HT", { x: 415, y: startY, size: 10, font: bold });
  page.drawText("Total HT", { x: 500, y: startY, size: 10, font: bold });

  items.forEach((item, index) => {
    const y = startY - 26 - index * 28;
    page.drawText(String(item.product_reference ?? ""), { x: 48, y, size: 9, font });
    page.drawText(String(item.product_name ?? "").slice(0, 42), { x: 130, y, size: 9, font });
    page.drawText(String(item.quantity ?? 0), { x: 370, y, size: 9, font });
    page.drawText(formatCurrency(Number(item.unit_price_ht ?? 0)), { x: 410, y, size: 9, font });
    page.drawText(formatCurrency(Number(item.line_total_ht ?? 0)), { x: 500, y, size: 9, font });
  });

  page.drawText(`Total HT: ${formatCurrency(Number(readOrderField(order, "subtotal_ht", "total_ht") ?? 0))}`, { x: 390, y: 160, size: 12, font: bold });
  page.drawText(`TVA: ${formatCurrency(Number(readOrderField(order, "total_vat", "total_tva") ?? 0))}`, { x: 390, y: 140, size: 11, font });
  page.drawText(`Total TTC: ${formatCurrency(Number(order.total_ttc ?? 0))}`, { x: 390, y: 116, size: 14, font: bold, color: green });
  page.drawText(String(readOrderField(order, "comments", "commentaire") ?? ""), { x: 48, y: 112, size: 10, font });
  page.drawText("Document genere automatiquement par Biolaur CRM Terrain.", { x: 48, y: 54, size: 9, font });

  return pdfDoc.save();
}
