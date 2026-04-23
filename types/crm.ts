export type RecordType = "prospect" | "client";
export type ClientType = "CHR" | "collectivite" | "commerce_de_bouche" | "autre";
export type CommercialStatus =
  | "a_prospecter"
  | "en_cours"
  | "relance"
  | "gagne"
  | "perdu"
  | "actif"
  | "inactif";
export type OrderStatus = "brouillon" | "envoyee" | "validee" | "livree" | "payee" | "annulee";
export type ActionType = "appel" | "visite" | "relance" | "email" | "rendez_vous" | "note";
export type ActionStatus = "a_faire" | "fait" | "annule";
export type ProductDocumentType = "fiche_technique" | "fiche_securite" | "bon_commande" | "plaquette" | "autre";
export type EmailSendStatus = "draft" | "sent" | "failed";
export type EmailAttachmentType = "product_document" | "order_pdf" | "client_document" | "other";
export type CommissionStatus = "a_venir" | "due" | "payee";
export type SortDirection = "asc" | "desc";

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "commercial" | "manager";
  createdAt: string;
  updatedAt: string;
}

export interface ProspectClient {
  id: string;
  ownerUserId: string;
  recordType: RecordType;
  companyName: string;
  tradeName: string;
  clientType: ClientType;
  commercialStatus: CommercialStatus;
  siret: string;
  vatNumber?: string;
  contactFirstName: string;
  contactLastName: string;
  contactJobTitle: string;
  phone: string;
  mobile: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  country: string;
  geographicSector: string;
  notes: string;
  source: string;
  lastInteractionAt?: string;
  nextFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientContact {
  id: string;
  prospectClientId: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  mobile: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  reference: string;
  code: string;
  name: string;
  shortDescription: string;
  longDescription?: string;
  brand: string;
  rangeName: string;
  packaging: string;
  unit: string;
  ean: string;
  vatRate: number;
  isActive: boolean;
  technicalSheetUrl: string;
  safetySheetUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDocument {
  id: string;
  productId: string;
  documentType: ProductDocumentType;
  title: string;
  fileName: string;
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceList {
  id: string;
  name: string;
  code: string;
  geographicScope: string;
  startsAt: string;
  endsAt?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string;
  unitPriceHt: number;
  discountPercent: number;
  conditioning: string;
  minQuantity?: number;
  isAvailable: boolean;
  effectiveDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  productReference: string;
  productName: string;
  quantity: number;
  unitPriceHt: number;
  discountPercent: number;
  vatRate: number;
  lineTotalHt: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  ownerUserId: string;
  orderNumber: string;
  prospectClientId: string;
  clientName?: string;
  orderStatus: OrderStatus;
  orderDate: string;
  deliveryAddressLine1: string;
  deliveryAddressLine2?: string;
  deliveryPostalCode: string;
  deliveryCity: string;
  deliveryCountry: string;
  comments?: string;
  subtotalHt: number;
  totalVat: number;
  totalTtc: number;
  estimatedCommissionAmount: number;
  commissionRate: number;
  pdfUrl?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CommercialAction {
  id: string;
  ownerUserId: string;
  prospectClientId: string;
  actionType: ActionType;
  actionStatus: ActionStatus;
  actionDate: string;
  summary: string;
  details?: string;
  nextActionType?: ActionType;
  nextActionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  code: "send_technical_sheet" | "send_order" | "send_account_opening" | "send_sales_pack";
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLogAttachment {
  id: string;
  emailLogId: string;
  attachmentType: EmailAttachmentType;
  productDocumentId?: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  ownerUserId: string;
  prospectClientId?: string;
  orderId?: string;
  emailTemplateId?: string;
  recipientEmail: string;
  ccEmail?: string;
  bccEmail?: string;
  subject: string;
  body: string;
  sendStatus: EmailSendStatus;
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  attachments: EmailLogAttachment[];
}

export interface Commission {
  id: string;
  ownerUserId: string;
  orderId: string;
  prospectClientId?: string;
  commissionBaseHt: number;
  commissionRate: number;
  commissionAmount: number;
  commissionStatus: CommissionStatus;
  calculatedAt: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: string;
  ownerUserId: string;
  companyName: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  companyAddress: string;
  logoUrl?: string;
  defaultCommissionRate: number;
  defaultVatRate: number;
  clientCategories?: string;
  productCategories?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}
