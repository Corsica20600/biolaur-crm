import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createOrderPdf } from "@/lib/pdf/order-pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, response } = await requireAuthenticatedUser();
  if (response || !user) return response;

  const pdf = await createOrderPdf(id, user.id);

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="bon-de-commande-${id}.pdf"`
    }
  });
}
