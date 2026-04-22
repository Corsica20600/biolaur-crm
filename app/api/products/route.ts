import { NextResponse } from "next/server";
import { getProductCatalog } from "@/lib/catalog-data";

export async function GET() {
  try {
    return NextResponse.json(await getProductCatalog());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur catalogue" }, { status: 500 });
  }
}
