import { NextResponse } from "next/server";
import { getProductCatalog } from "@/lib/catalog-data";
import { requireAuthenticatedUser } from "@/lib/server-auth";

export async function GET() {
  try {
    const { response } = await requireAuthenticatedUser();
    if (response) return response;

    return NextResponse.json(await getProductCatalog());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur catalogue" }, { status: 500 });
  }
}
