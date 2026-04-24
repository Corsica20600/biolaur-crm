import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createAdminClient } from "@/supabase/admin";

type DbRow = Record<string, unknown>;

function readOrderField(row: DbRow, canonical: string, legacy?: string) {
  if (row[canonical] !== undefined && row[canonical] !== null) return row[canonical];
  if (legacy && row[legacy] !== undefined && row[legacy] !== null) return row[legacy];
  return undefined;
}

function readItemField(row: DbRow, ...keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

function isOwnedByUser(row: DbRow, userId: string) {
  const ownerUserId = readOrderField(row, "owner_user_id", "owner_id");
  if (!ownerUserId) return true;
  return String(ownerUserId) === userId;
}

async function findOrder(
  supabase: ReturnType<typeof createAdminClient>,
  orderIdOrNumber: string,
  ownerUserId?: string
) {
  let lastDbError: string | null = null;

  const byId = await supabase.from("orders").select("*").eq("id", orderIdOrNumber).maybeSingle();
  if (!byId.error && byId.data) {
    const row = byId.data as DbRow;
    if (!ownerUserId || isOwnedByUser(row, ownerUserId)) return { row, error: null as null };
    return { row: null, error: { message: "Commande introuvable." } };
  }
  if (byId.error) lastDbError = byId.error.message;

  const byOrderNumber = await supabase.from("orders").select("*").eq("order_number", orderIdOrNumber).maybeSingle();
  if (!byOrderNumber.error && byOrderNumber.data) {
    const row = byOrderNumber.data as DbRow;
    if (!ownerUserId || isOwnedByUser(row, ownerUserId)) return { row, error: null as null };
    return { row: null, error: { message: "Commande introuvable." } };
  }
  if (byOrderNumber.error) lastDbError = byOrderNumber.error.message;

  const byNumeroCommande = await supabase.from("orders").select("*").eq("numero_commande", orderIdOrNumber).maybeSingle();
  if (!byNumeroCommande.error && byNumeroCommande.data) {
    const row = byNumeroCommande.data as DbRow;
    if (!ownerUserId || isOwnedByUser(row, ownerUserId)) return { row, error: null as null };
    return { row: null, error: { message: "Commande introuvable." } };
  }

  return {
    row: null,
    error: byNumeroCommande.error ?? (lastDbError ? { message: lastDbError } : { message: "Commande introuvable." })
  };
}

export async function createOrderPdf(orderId: string, ownerUserId?: string) {
  const supabase = createAdminClient();
  const { row: dbOrder, error: orderError } = await findOrder(supabase, orderId, ownerUserId);

  if (orderError || !dbOrder) {
    throw new Error(orderError?.message ?? "Commande introuvable.");
  }

  const resolvedOrderId = String(dbOrder.id ?? "");
  const { data: dbItems, error: itemsError } = await supabase.from("order_items").select("*").eq("order_id", resolvedOrderId);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const order = dbOrder as DbRow;
  const prospectClientId = String(readOrderField(order, "prospect_client_id", "client_id") ?? "");
  const { data: dbProspectClient, error: prospectClientError } = prospectClientId
    ? await supabase.from("prospects_clients").select("*").eq("id", prospectClientId).maybeSingle()
    : { data: null, error: null };
  if (prospectClientError) {
    throw new Error(prospectClientError.message);
  }

  const client = (dbProspectClient ?? {}) as DbRow;
  const items = ((dbItems ?? []) as DbRow[]).sort((a, b) => {
    const aSort = Number(readItemField(a, "sort_order", "ordre") ?? 0);
    const bSort = Number(readItemField(b, "sort_order", "ordre") ?? 0);
    if (aSort !== bSort) return aSort - bSort;
    const aCreatedAt = String(readItemField(a, "created_at") ?? "");
    const bCreatedAt = String(readItemField(b, "created_at") ?? "");
    return aCreatedAt.localeCompare(bCreatedAt);
  });

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
    page.drawText(String(readItemField(item, "product_reference", "reference") ?? ""), { x: 48, y, size: 9, font });
    page.drawText(String(readItemField(item, "product_name", "nom_produit", "designation") ?? "Produit").slice(0, 42), {
      x: 130,
      y,
      size: 9,
      font
    });
    page.drawText(String(readItemField(item, "quantity", "quantite") ?? 0), { x: 370, y, size: 9, font });
    page.drawText(formatCurrency(Number(readItemField(item, "unit_price_ht", "prix_unitaire_ht", "prix_unitaire") ?? 0)), {
      x: 410,
      y,
      size: 9,
      font
    });
    page.drawText(formatCurrency(Number(readItemField(item, "line_total_ht", "total_ligne_ht", "sous_total") ?? 0)), {
      x: 500,
      y,
      size: 9,
      font
    });
  });

  page.drawText(`Total HT: ${formatCurrency(Number(readOrderField(order, "subtotal_ht", "total_ht") ?? 0))}`, { x: 390, y: 160, size: 12, font: bold });
  page.drawText(`TVA: ${formatCurrency(Number(readOrderField(order, "total_vat", "total_tva") ?? 0))}`, { x: 390, y: 140, size: 11, font });
  page.drawText(`Total TTC: ${formatCurrency(Number(order.total_ttc ?? 0))}`, { x: 390, y: 116, size: 14, font: bold, color: green });
  page.drawText(String(readOrderField(order, "comments", "commentaire") ?? ""), { x: 48, y: 112, size: 10, font });
  page.drawText("Document genere automatiquement par Biolaur CRM Terrain.", { x: 48, y: 54, size: 9, font });

  return pdfDoc.save();
}
