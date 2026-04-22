import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { clients, orders } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createAdminClient } from "@/supabase/admin";

export async function createOrderPdf(orderId: string, ownerUserId?: string) {
  let order = ownerUserId ? undefined : orders.find((item) => item.id === orderId);
  let client = order ? clients.find((item) => item.id === order!.prospectClientId) : undefined;

  if (!order) {
    const supabase = createAdminClient();
    const [{ data: dbOrder }, { data: dbItems }] = await Promise.all([
      supabase
        .from("orders")
        .select("*, clients(*)")
        .eq("id", orderId)
        .match(ownerUserId ? { owner_user_id: ownerUserId } : {})
        .single(),
      supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .match(ownerUserId ? { owner_user_id: ownerUserId } : {})
        .order("created_at")
    ]);

    if (dbOrder) {
      order = {
        id: dbOrder.id,
        ownerUserId: dbOrder.owner_user_id ?? dbOrder.owner_id,
        orderNumber: dbOrder.numero_commande,
        prospectClientId: dbOrder.client_id,
        clientName: dbOrder.clients?.nom_commercial || dbOrder.clients?.raison_sociale,
        orderStatus: dbOrder.statut,
        orderDate: dbOrder.date_commande,
        deliveryAddressLine1: dbOrder.adresse_livraison ?? "",
        deliveryPostalCode: "",
        deliveryCity: "",
        deliveryCountry: "France",
        comments: dbOrder.commentaire ?? "",
        subtotalHt: Number(dbOrder.total_ht ?? 0),
        totalVat: Number(dbOrder.total_tva ?? 0),
        totalTtc: Number(dbOrder.total_ttc ?? 0),
        estimatedCommissionAmount: Number(dbOrder.commission_estimee ?? 0),
        commissionRate: 20,
        createdAt: dbOrder.created_at,
        updatedAt: dbOrder.updated_at,
        items: (dbItems ?? []).map((item) => ({
          id: item.id,
          orderId: item.order_id,
          productId: item.product_id,
          productReference: item.reference,
          productName: item.designation,
          quantity: Number(item.quantite ?? 0),
          unitPriceHt: Number(item.prix_unitaire_ht ?? 0),
          discountPercent: Number(item.remise ?? 0),
          vatRate: 20,
          lineTotalHt: Number(item.total_ligne_ht ?? 0),
          sortOrder: 0,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }))
      };
      client = dbOrder.clients
        ? {
            companyName: dbOrder.clients.raison_sociale,
            addressLine1: dbOrder.clients.adresse,
            postalCode: dbOrder.clients.code_postal,
            city: dbOrder.clients.ville
          } as typeof client
        : undefined;
    }
  }

  if (ownerUserId && !order) {
    throw new Error("Commande introuvable pour cet utilisateur.");
  }

  order ??= orders[0];
  client ??= clients.find((item) => item.id === order.prospectClientId);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const green = rgb(0.12, 0.48, 0.32);
  const dark = rgb(0.09, 0.13, 0.11);

  page.drawText("Biolaur Distribution", { x: 48, y: 790, size: 20, font: bold, color: green });
  page.drawText("Bon de commande", { x: 48, y: 760, size: 28, font: bold, color: dark });
  page.drawText(order.orderNumber, { x: 48, y: 730, size: 13, font, color: dark });
  page.drawText(`Date: ${formatDate(order.orderDate)}`, { x: 420, y: 730, size: 11, font, color: dark });

  page.drawText("Client", { x: 48, y: 680, size: 13, font: bold, color: dark });
  page.drawText(client?.companyName ?? "Client", { x: 48, y: 660, size: 11, font, color: dark });
  page.drawText(client ? `${client.addressLine1}, ${client.postalCode} ${client.city}` : "", {
    x: 48,
    y: 644,
    size: 10,
    font,
    color: dark
  });
  page.drawText(`Livraison: ${order.deliveryAddressLine1}, ${order.deliveryPostalCode} ${order.deliveryCity}`, { x: 48, y: 618, size: 10, font, color: dark });

  const startY = 570;
  page.drawText("Ref.", { x: 48, y: startY, size: 10, font: bold });
  page.drawText("Designation", { x: 130, y: startY, size: 10, font: bold });
  page.drawText("Qte", { x: 365, y: startY, size: 10, font: bold });
  page.drawText("PU HT", { x: 415, y: startY, size: 10, font: bold });
  page.drawText("Total HT", { x: 500, y: startY, size: 10, font: bold });

  order.items.forEach((item, index) => {
    const y = startY - 26 - index * 28;
    page.drawText(item.productReference, { x: 48, y, size: 9, font });
    page.drawText(item.productName.slice(0, 42), { x: 130, y, size: 9, font });
    page.drawText(String(item.quantity), { x: 370, y, size: 9, font });
    page.drawText(formatCurrency(item.unitPriceHt), { x: 410, y, size: 9, font });
    page.drawText(formatCurrency(item.lineTotalHt), { x: 500, y, size: 9, font });
  });

  page.drawText(`Total HT: ${formatCurrency(order.subtotalHt)}`, { x: 390, y: 160, size: 12, font: bold });
  page.drawText(`TVA: ${formatCurrency(order.totalVat)}`, { x: 390, y: 140, size: 11, font });
  page.drawText(`Total TTC: ${formatCurrency(order.totalTtc)}`, { x: 390, y: 116, size: 14, font: bold, color: green });
  page.drawText(order.comments ?? "", { x: 48, y: 112, size: 10, font });
  page.drawText("Document genere automatiquement par Biolaur CRM Terrain.", { x: 48, y: 54, size: 9, font });

  return pdfDoc.save();
}
