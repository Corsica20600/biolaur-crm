import type {
  AppSettings,
  CommercialAction,
  Commission,
  EmailLog,
  EmailTemplate,
  Order,
  PriceList,
  PriceListItem,
  Product,
  ProductCategory,
  ProductDocument,
  ProspectClient
} from "@/types/crm";

const now = "2026-04-21";
const ownerUserId = "demo-user";

export const appSettings: AppSettings = {
  id: "settings-demo",
  ownerUserId,
  companyName: "Biolaur Distribution",
  senderName: "Demo Commercial",
  senderEmail: "commercial@biolaur.fr",
  senderPhone: "05 56 00 00 00",
  companyAddress: "12 rue des Artisans, 33000 Bordeaux",
  defaultCommissionRate: 20,
  defaultVatRate: 20,
  currency: "EUR",
  createdAt: now,
  updatedAt: now
};

export const productCategories: ProductCategory[] = [
  { id: "cat-vaisselle-machine", name: "Vaisselle machine", slug: "vaisselle_machine", createdAt: now, updatedAt: now },
  { id: "cat-vaisselle-main", name: "Vaisselle main", slug: "vaisselle_main", createdAt: now, updatedAt: now },
  { id: "cat-sanitaire", name: "Sanitaire", slug: "sanitaire", createdAt: now, updatedAt: now },
  { id: "cat-vitres", name: "Vitres", slug: "vitres", createdAt: now, updatedAt: now },
  { id: "cat-ambiance", name: "Ambiance et odeurs", slug: "ambiance_odeurs", createdAt: now, updatedAt: now },
  { id: "cat-detartrants", name: "Detartrants", slug: "detartrants", createdAt: now, updatedAt: now },
  { id: "cat-maintenance", name: "Maintenance technique", slug: "maintenance_technique", createdAt: now, updatedAt: now },
  { id: "cat-canalisations", name: "Canalisations", slug: "canalisations", createdAt: now, updatedAt: now },
  { id: "cat-surfaces", name: "Surfaces", slug: "surfaces", createdAt: now, updatedAt: now }
];

export const prospectsClients: ProspectClient[] = [
  client("pc-atlantic", "client", "SARL Restaurant Atlantic", "L'Atlantic", "CHR", "actif", "Sophie", "Martin", "Gerante", "Bordeaux", "Bordeaux centre", "Gros potentiel vaisselle machine et hygiene cuisine.", "2026-04-18", "2026-04-26"),
  client("pc-lormont", "client", "Mairie de Lormont", "Services techniques Lormont", "collectivite", "actif", "Karim", "Benali", "Responsable achats", "Lormont", "Rive droite", "Besoin de documents administratifs complets.", "2026-04-12", "2026-05-04"),
  client("pc-hotel-pins", "client", "Hotel des Pins SAS", "Hotel des Pins", "CHR", "actif", "Claire", "Renaud", "Directrice", "Arcachon", "Bassin", "Sanitaire, odeurs et entretien chambres.", "2026-04-19", "2026-04-30"),
  client("pc-boulangerie", "client", "Boulangerie Saint-Pierre", "Boulangerie Saint-Pierre", "commerce_de_bouche", "actif", "Julien", "Moreau", "Dirigeant", "Bordeaux", "Bordeaux centre", "Consommation recurrente sols, vitres et plonge.", "2026-04-10", "2026-04-25"),
  client("pc-college", "client", "College Jean Moulin", "College Jean Moulin", "collectivite", "actif", "Nadia", "Perrin", "Gestionnaire", "Merignac", "Merignac", "Commandes par periode scolaire.", "2026-04-06", "2026-05-09"),
  client("pc-boucherie", "prospect", "Boucherie Dumas SAS", "Boucherie Dumas", "commerce_de_bouche", "relance", "Paul", "Dumas", "Dirigeant", "Bordeaux", "Bordeaux Bastide", "Interesse par degraissant et sacherie.", "2026-04-17", "2026-04-23"),
  client("pc-promenade", "prospect", "Cafe de la Promenade", "La Promenade", "CHR", "en_cours", "Emma", "Leroy", "Responsable salle", "Merignac", "Merignac", "Demande echantillons lavage verre.", "2026-04-15", "2026-04-28"),
  client("pc-traiteur", "prospect", "Traiteur Garonne", "Traiteur Garonne", "CHR", "a_prospecter", "Lucie", "Vidal", "Acheteuse", "Begles", "Sud Bordeaux", "Gros volume potentiel reception.", undefined, "2026-04-27"),
  client("pc-ehpad", "prospect", "EHPAD Les Acacias", "Les Acacias", "collectivite", "relance", "Michel", "Andre", "Responsable maintenance", "Pessac", "Pessac", "Besoin canalisations et sanitaires.", "2026-04-20", "2026-04-24"),
  client("pc-fromagerie", "prospect", "Fromagerie du Marche", "Fromagerie du Marche", "commerce_de_bouche", "en_cours", "Anne", "Roche", "Gerante", "Bordeaux", "Bordeaux centre", "Compare prix liquides vaisselle et vitres.", "2026-04-16", "2026-04-29")
];

function client(
  id: string,
  recordType: ProspectClient["recordType"],
  companyName: string,
  tradeName: string,
  clientType: ProspectClient["clientType"],
  commercialStatus: ProspectClient["commercialStatus"],
  firstName: string,
  lastName: string,
  jobTitle: string,
  city: string,
  sector: string,
  notes: string,
  lastInteractionAt?: string,
  nextFollowUpAt?: string
): ProspectClient {
  return {
    id,
    ownerUserId,
    recordType,
    companyName,
    tradeName,
    clientType,
    commercialStatus,
    siret: "81234567800019",
    contactFirstName: firstName,
    contactLastName: lastName,
    contactJobTitle: jobTitle,
    phone: "05 56 00 00 00",
    mobile: "06 00 00 00 00",
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.fr`,
    addressLine1: "12 rue du Commerce",
    postalCode: city === "Bordeaux" ? "33000" : "33700",
    city,
    country: "France",
    geographicSector: sector,
    notes,
    source: "Terrain",
    lastInteractionAt,
    nextFollowUpAt,
    createdAt: "2026-01-08",
    updatedAt: now
  };
}

let productsSeedIndex = 201;

export const products: Product[] = [
  product("prd-lvm", "cat-vaisselle-machine", "BIO-LVM-ED-20", "LVMED20", "LVM machine eau dure", "Lessive machine professionnelle eau dure.", "Vaisselle Pro", "Bidon 20 L", 54.9, "technical-sheets/lvm-machine-eau-dure.pdf", "safety-sheets/lvm-machine-eau-dure.pdf"),
  product("prd-rincage", "cat-vaisselle-machine", "BIO-RINC-5", "RINC5", "Liquide rincage machine", "Produit de rincage pour brillance vaisselle.", "Vaisselle Pro", "Bidon 5 L", 18.7, "technical-sheets/liquide-rincage-machine.pdf", "safety-sheets/liquide-rincage-machine.pdf"),
  product("prd-detartrant-machine", "cat-detartrants", "BIO-DET-MACH-5", "DETM5", "Detartrant machine", "Detartrant acide pour machines et circuits.", "Technique", "Bidon 5 L", 22.8, "technical-sheets/detartrant-machine.pdf", "safety-sheets/detartrant-machine.pdf"),
  product("prd-sdb", "cat-sanitaire", "BIO-SDB-750", "SDB750", "Nettoyant salle de bain", "Nettoyant sanitaire pret a l'emploi.", "Sanitaire", "Pulverisateur 750 ml", 5.9, "technical-sheets/nettoyant-salle-de-bain.pdf", "safety-sheets/nettoyant-salle-de-bain.pdf"),
  product("prd-anti-calcaire", "cat-detartrants", "BIO-ANTI-CAL-1", "ANTICAL1", "Anti-calcaire", "Anti-calcaire surfaces et robinetterie.", "Sanitaire", "Flacon 1 L", 6.4, "technical-sheets/anti-calcaire.pdf", "safety-sheets/anti-calcaire.pdf"),
  product("prd-activatop", "cat-canalisations", "BIO-ACTIVATOP-5", "ACTIV5", "Activatop bac a graisse", "Activateur biologique pour bacs a graisse.", "Canalisations", "Bidon 5 L", 38.5, "technical-sheets/activatop-bac-a-graisse.pdf"),
  product("prd-vitres", "cat-vitres", "BIO-VITRES-750", "VIT750", "Nettoyant vitres", "Nettoyant vitres sans traces.", "Surfaces", "Pulverisateur 750 ml", 4.7, "technical-sheets/nettoyant-vitres.pdf"),
  product("prd-liquide-vaisselle", "cat-vaisselle-main", "BIO-LV-CIT-1", "LVCIT1", "Liquide vaisselle", "Liquide vaisselle concentre citron.", "Vaisselle main", "Flacon 1 L", 3.8, "technical-sheets/liquide-vaisselle.pdf"),
  product("prd-spray", "cat-ambiance", "BIO-SPRAY-AMB-750", "AMB750", "Spray ambiance", "Spray ambiance longue duree.", "Ambiance", "Pulverisateur 750 ml", 7.2, "technical-sheets/spray-ambiance.pdf"),
  product("prd-metaux", "cat-maintenance", "BIO-RENOV-MET-500", "MET500", "Renovateur metaux", "Renovateur inox et metaux.", "Maintenance", "Aerosol 500 ml", 9.9, "technical-sheets/renovateur-metaux.pdf", "safety-sheets/renovateur-metaux.pdf"),
  product("prd-surfaces", "cat-surfaces", "BIO-SURF-5", "SURF5", "Nettoyant surfaces alimentaires", "Nettoyant polyvalent surfaces alimentaires.", "Surfaces", "Bidon 5 L", 16.8, "technical-sheets/nettoyant-surfaces-alimentaires.pdf", "safety-sheets/nettoyant-surfaces-alimentaires.pdf"),
  product("prd-papier", "cat-sanitaire", "BIO-PAPIER-Z-3000", "PAPZ3000", "Essuie-mains Z blanc", "Essuie-mains interfolies sanitaires.", "Sanitaire", "Carton 3000 formats", 24.5, "technical-sheets/essuie-mains-z.pdf")
];

function product(id: string, categoryId: string, reference: string, code: string, name: string, shortDescription: string, rangeName: string, packaging: string, unitPrice: number, technicalSheetUrl: string, safetySheetUrl?: string): Product {
  return {
    id,
    categoryId,
    reference,
    code,
    name,
    shortDescription,
    longDescription: shortDescription,
    brand: "Biolaur",
    rangeName,
    packaging,
    unit: packaging.includes("Carton") ? "carton" : packaging.includes("Aerosol") ? "aerosol" : "unite",
    ean: `376000000${String(productsSeedIndex++).padStart(4, "0")}`,
    vatRate: 20,
    isActive: true,
    technicalSheetUrl,
    safetySheetUrl,
    notes: unitPrice > 30 ? "Produit a forte valeur commerciale." : undefined,
    createdAt: "2026-01-01",
    updatedAt: now
  };
}

export const productDocuments: ProductDocument[] = products.flatMap((productItem) => [
  {
    id: `doc-ft-${productItem.id}`,
    productId: productItem.id,
    documentType: "fiche_technique",
    title: `FT - ${productItem.name}`,
    fileName: `${productItem.reference}-ft.pdf`,
    storagePath: productItem.technicalSheetUrl,
    publicUrl: productItem.technicalSheetUrl,
    mimeType: "application/pdf",
    createdAt: productItem.createdAt,
    updatedAt: productItem.updatedAt
  },
  ...(productItem.safetySheetUrl
    ? [
        {
          id: `doc-fds-${productItem.id}`,
          productId: productItem.id,
          documentType: "fiche_securite" as const,
          title: `FDS - ${productItem.name}`,
          fileName: `${productItem.reference}-fds.pdf`,
          storagePath: productItem.safetySheetUrl,
          publicUrl: productItem.safetySheetUrl,
          mimeType: "application/pdf",
          createdAt: productItem.createdAt,
          updatedAt: productItem.updatedAt
        }
      ]
    : [])
]);

export const priceLists: PriceList[] = [
  {
    id: "price-list-corse-2026",
    name: "Tarif BIOLAUR SP 2026 CORSE",
    code: "BIOLAUR-SP-2026-CORSE",
    geographicScope: "Corse",
    startsAt: "2026-01-01",
    endsAt: "2026-12-31",
    isActive: true,
    notes: "Tarif demo commercial terrain",
    createdAt: "2026-01-01",
    updatedAt: now
  }
];

export const priceListItems: PriceListItem[] = products.map((productItem, index) => ({
  id: `pli-${productItem.id}`,
  priceListId: priceLists[0].id,
  productId: productItem.id,
  unitPriceHt: [54.9, 18.7, 22.8, 5.9, 6.4, 38.5, 4.7, 3.8, 7.2, 9.9, 16.8, 24.5][index] ?? 10,
  discountPercent: index < 2 ? 5 : 0,
  conditioning: productItem.packaging,
  minQuantity: 1,
  isAvailable: true,
  effectiveDate: "2026-01-01",
  createdAt: "2026-01-01",
  updatedAt: now
}));

export const orders: Order[] = [
  {
    id: "ord-260001",
    ownerUserId,
    orderNumber: "CMD-2026-0001",
    prospectClientId: "pc-atlantic",
    orderStatus: "validee",
    orderDate: "2026-04-10",
    deliveryAddressLine1: "18 quai Richelieu",
    deliveryPostalCode: "33000",
    deliveryCity: "Bordeaux",
    deliveryCountry: "France",
    comments: "Livraison avant service du midi.",
    subtotalHt: 229.83,
    totalVat: 45.97,
    totalTtc: 275.8,
    estimatedCommissionAmount: 45.97,
    commissionRate: 20,
    pdfUrl: "/api/orders/ord-260001/pdf",
    createdAt: "2026-04-10",
    updatedAt: "2026-04-12",
    items: [
      orderItem("ori-1", "ord-260001", "prd-lvm", "BIO-LVM-ED-20", "LVM machine eau dure", 2, 54.9, 5, 1),
      orderItem("ori-2", "ord-260001", "prd-rincage", "BIO-RINC-5", "Liquide rincage machine", 4, 18.7, 5, 2),
      orderItem("ori-3", "ord-260001", "prd-liquide-vaisselle", "BIO-LV-CIT-1", "Liquide vaisselle", 12, 3.8, 0, 3)
    ]
  },
  {
    id: "ord-260002",
    ownerUserId,
    orderNumber: "CMD-2026-0002",
    prospectClientId: "pc-lormont",
    orderStatus: "envoyee",
    orderDate: "2026-04-14",
    deliveryAddressLine1: "Atelier municipal",
    deliveryPostalCode: "33310",
    deliveryCity: "Lormont",
    deliveryCountry: "France",
    comments: "Joindre documents administratifs.",
    subtotalHt: 453.1,
    totalVat: 90.62,
    totalTtc: 543.72,
    estimatedCommissionAmount: 90.62,
    commissionRate: 20,
    pdfUrl: "/api/orders/ord-260002/pdf",
    createdAt: "2026-04-14",
    updatedAt: "2026-04-14",
    items: [
      orderItem("ori-4", "ord-260002", "prd-sdb", "BIO-SDB-750", "Nettoyant salle de bain", 24, 5.9, 0, 1),
      orderItem("ori-5", "ord-260002", "prd-papier", "BIO-PAPIER-Z-3000", "Essuie-mains Z blanc", 8, 24.5, 0, 2),
      orderItem("ori-6", "ord-260002", "prd-activatop", "BIO-ACTIVATOP-5", "Activatop bac a graisse", 3, 38.5, 0, 3)
    ]
  }
];

function orderItem(id: string, orderId: string, productId: string, productReference: string, productName: string, quantity: number, unitPriceHt: number, discountPercent: number, sortOrder: number) {
  const lineTotalHt = quantity * unitPriceHt * (1 - discountPercent / 100);
  return {
    id,
    orderId,
    productId,
    productReference,
    productName,
    quantity,
    unitPriceHt,
    discountPercent,
    vatRate: 20,
    lineTotalHt,
    sortOrder,
    createdAt: "2026-04-10",
    updatedAt: "2026-04-10"
  };
}

export const commercialActions: CommercialAction[] = [
  action("act-1", "pc-atlantic", "visite", "fait", "2026-04-18", "Controle stock cuisine", "Besoin recurrent LVM et rincage.", "relance", "2026-04-26"),
  action("act-2", "pc-boucherie", "relance", "a_faire", "2026-04-20", "Relance tarif sacherie", "A recu les fiches techniques.", "visite", "2026-04-23"),
  action("act-3", "pc-lormont", "email", "fait", "2026-04-12", "Envoi dossier administratif", "Demande validation commande.", "relance", "2026-05-04"),
  action("act-4", "pc-ehpad", "appel", "a_faire", "2026-04-21", "Qualifier maintenance", "Verifier besoin canalisations.", "rendez_vous", "2026-04-24")
];

function action(id: string, prospectClientId: string, actionType: CommercialAction["actionType"], actionStatus: CommercialAction["actionStatus"], actionDate: string, summary: string, details: string, nextActionType?: CommercialAction["nextActionType"], nextActionDate?: string): CommercialAction {
  return { id, ownerUserId, prospectClientId, actionType, actionStatus, actionDate, summary, details, nextActionType, nextActionDate, createdAt: actionDate, updatedAt: actionDate };
}

export const emailTemplates: EmailTemplate[] = [
  { id: "tpl-ft", code: "send_technical_sheet", name: "Envoi fiches techniques", subjectTemplate: "Vos fiches techniques produit", bodyTemplate: "Bonjour,\n\nVeuillez trouver ci-joint les fiches techniques demandées.\n\nCordialement", isActive: true, createdAt: now, updatedAt: now },
  { id: "tpl-order", code: "send_order", name: "Envoi bon de commande", subjectTemplate: "Bon de commande", bodyTemplate: "Bonjour,\n\nVeuillez trouver ci-joint votre bon de commande.\n\nCordialement", isActive: true, createdAt: now, updatedAt: now },
  { id: "tpl-account", code: "send_account_opening", name: "Ouverture de compte", subjectTemplate: "Documents ouverture de compte", bodyTemplate: "Bonjour,\n\nVeuillez trouver ci-joint les documents nécessaires à l’ouverture de compte.\n\nCordialement", isActive: true, createdAt: now, updatedAt: now },
  { id: "tpl-pack", code: "send_sales_pack", name: "Pack commercial", subjectTemplate: "Documentation commerciale", bodyTemplate: "Bonjour,\n\nVeuillez trouver ci-joint la documentation commerciale demandée.\n\nCordialement", isActive: true, createdAt: now, updatedAt: now }
];

export const emailLogs: EmailLog[] = [
  {
    id: "mail-1",
    ownerUserId,
    prospectClientId: "pc-boucherie",
    emailTemplateId: "tpl-ft",
    recipientEmail: "paul.dumas@example.fr",
    subject: "Vos fiches techniques produit",
    body: "Envoi des fiches techniques demandées.",
    sendStatus: "sent",
    sentAt: "2026-04-17",
    createdAt: "2026-04-17",
    updatedAt: "2026-04-17",
    attachments: [
      { id: "att-1", emailLogId: "mail-1", attachmentType: "product_document", productDocumentId: "doc-ft-prd-lvm", fileName: "BIO-LVM-ED-20-ft.pdf", fileUrl: "technical-sheets/lvm-machine-eau-dure.pdf", createdAt: "2026-04-17" }
    ]
  },
  {
    id: "mail-2",
    ownerUserId,
    prospectClientId: "pc-atlantic",
    orderId: "ord-260001",
    emailTemplateId: "tpl-order",
    recipientEmail: "sophie.martin@example.fr",
    subject: "Bon de commande",
    body: "Bon de commande envoye pour validation.",
    sendStatus: "sent",
    sentAt: "2026-04-10",
    createdAt: "2026-04-10",
    updatedAt: "2026-04-10",
    attachments: [
      { id: "att-2", emailLogId: "mail-2", attachmentType: "order_pdf", fileName: "CMD-2026-0001.pdf", fileUrl: "/api/orders/ord-260001/pdf", createdAt: "2026-04-10" }
    ]
  }
];

export const commissions: Commission[] = orders.map((order) => ({
  id: `com-${order.id}`,
  ownerUserId,
  orderId: order.id,
  prospectClientId: order.prospectClientId,
  commissionBaseHt: order.subtotalHt,
  commissionRate: order.commissionRate,
  commissionAmount: order.estimatedCommissionAmount,
  commissionStatus: order.orderStatus === "payee" ? "payee" : order.orderStatus === "validee" ? "due" : "a_venir",
  calculatedAt: order.orderDate,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt
}));

// Backward-compatible aliases while older screens are migrated.
export const clients = prospectsClients;
export const actions = commercialActions;
export const documents = productDocuments;
