import type { AppSettings } from "@/types/crm";

const now = "2026-04-24";

export const defaultAppSettings: AppSettings = {
  id: "settings-default",
  ownerUserId: "",
  companyName: "Biolaur Distribution",
  senderName: "Commercial Biolaur",
  senderEmail: "commercial@biolaur.fr",
  senderPhone: "",
  companyAddress: "",
  defaultCommissionRate: 20,
  defaultVatRate: 20,
  currency: "EUR",
  createdAt: now,
  updatedAt: now
};
