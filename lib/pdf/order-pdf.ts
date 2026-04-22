import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { clients, orders } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function createOrderPdf(orderId: string) {
  const order = orders.find((item) => item.id === orderId) ?? orders[0];
  const client = clients.find((item) => item.id === order.prospectClientId);
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
