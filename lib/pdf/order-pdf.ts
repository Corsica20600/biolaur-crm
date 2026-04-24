import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createAdminClient } from "@/supabase/admin";

type DbRow = Record<string, unknown>;

export async function createOrderPdf(orderId: string, ownerUserId?: string) {
  const supabase = createAdminClient();
  const [{ data: dbOrder, error: orderError }, { data: dbItems, error: itemsError }] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .match(ownerUserId ? { owner_user_id: ownerUserId } : {})
      .single(),
    supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .match(ownerUserId ? { owner_user_id: ownerUserId } : {})
      .order("sort_order")
  ]);

  if (orderError || !dbOrder) {
    throw new Error(orderError?.message ?? "Commande introuvable.");
  }
  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const order = dbOrder as DbRow;
  const prospectClientId = String(order.prospect_client_id ?? "");
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
  page.drawText(String(order.order_number ?? ""), { x: 48, y: 730, size: 13, font, color: dark });
  page.drawText(`Date: ${formatDate(String(order.order_date ?? ""))}`, { x: 420, y: 730, size: 11, font, color: dark });

  page.drawText("Client", { x: 48, y: 680, size: 13, font: bold, color: dark });
  page.drawText(String(client.trade_name ?? client.company_name ?? "Client"), { x: 48, y: 660, size: 11, font, color: dark });
  page.drawText(
    `${String(client.address_line_1 ?? "")}, ${String(client.postal_code ?? "")} ${String(client.city ?? "")}`,
    { x: 48, y: 644, size: 10, font, color: dark }
  );
  page.drawText(
    `Livraison: ${String(order.delivery_address_line_1 ?? "")}, ${String(order.delivery_postal_code ?? "")} ${String(order.delivery_city ?? "")}`,
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

  page.drawText(`Total HT: ${formatCurrency(Number(order.subtotal_ht ?? 0))}`, { x: 390, y: 160, size: 12, font: bold });
  page.drawText(`TVA: ${formatCurrency(Number(order.total_vat ?? 0))}`, { x: 390, y: 140, size: 11, font });
  page.drawText(`Total TTC: ${formatCurrency(Number(order.total_ttc ?? 0))}`, { x: 390, y: 116, size: 14, font: bold, color: green });
  page.drawText(String(order.comments ?? ""), { x: 48, y: 112, size: 10, font });
  page.drawText("Document genere automatiquement par Biolaur CRM Terrain.", { x: 48, y: 54, size: 9, font });

  return pdfDoc.save();
}
