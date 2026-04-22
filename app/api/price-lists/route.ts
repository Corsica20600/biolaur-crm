import { NextResponse } from "next/server";
import { getPriceListCatalog } from "@/lib/catalog-data";

export async function GET() {
  try {
    return NextResponse.json(await getPriceListCatalog());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur tarifs" }, { status: 500 });
  }
}
