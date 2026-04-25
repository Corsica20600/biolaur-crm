import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createOrderPdf } from "@/lib/pdf/order-pdf";
import { createAdminClient } from "@/supabase/admin";

function extractMissingColumn(message: string) {
  const fromPostgrest = message.match(/Could not find the '([^']+)' column/i)?.[1];
  if (fromPostgrest) return fromPostgrest;
  const fromPostgres = message.match(/column "([^"]+)" of relation/i)?.[1] ?? message.match(/column "([^"]+)" does not exist/i)?.[1];
  return fromPostgres ?? null;
}

function readField(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined) return value;
  }
  return undefined;
}

function orderStatusRank(status: string) {
  if (status === "payee") return 4;
  if (status === "livree") return 3;
  if (status === "validee") return 2;
  if (status === "envoyee") return 1;
  if (status === "brouillon") return 0;
  if (status === "annulee") return -1;
  return 0;
}

async function promoteOrderStatusFromPdf(orderId: string, ownerUserId: string) {
  const supabase = createAdminClient();
  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  if (orderError || !orderRow) return;
  const current = String(readField(orderRow as Record<string, unknown>, "order_status", "statut") ?? "brouillon");
  if (current === "annulee") return;

  const nextStatus = orderStatusRank(current) >= orderStatusRank("validee") ? current : "validee";
  if (nextStatus === current) return;

  const payload: Record<string, unknown> = { order_status: nextStatus, statut: nextStatus };
  const workingPayload = { ...payload };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabase
      .from("orders")
      .update(workingPayload)
      .eq("id", orderId)
      .eq("owner_user_id", ownerUserId);

    if (!error) return;
    const missingColumn = extractMissingColumn(error.message ?? "");
    if (missingColumn && Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)) {
      delete workingPayload[missingColumn];
      continue;
    }
    return;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const pdf = await createOrderPdf(id, user.id);
    await promoteOrderStatusFromPdf(id, user.id);

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bon-de-commande-${id}.pdf"`
      }
    });
  } catch (error) {
    console.error("ORDER PDF ERROR", error);
    const message = error instanceof Error ? error.message : "Generation PDF impossible.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
