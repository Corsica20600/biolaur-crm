import { NextResponse } from "next/server";
import { createOrderPdf } from "@/lib/pdf/order-pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pdf = await createOrderPdf(id);

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="bon-de-commande-${id}.pdf"`
    }
  });
}
