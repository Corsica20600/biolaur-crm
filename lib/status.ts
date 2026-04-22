import type { ActionStatus, CommercialStatus, CommissionStatus, OrderStatus, RecordType } from "@/types/crm";

export const recordTypeLabels: Record<RecordType, string> = {
  prospect: "Prospect",
  client: "Client"
};

export const commercialStatusLabels: Record<CommercialStatus, string> = {
  a_prospecter: "A prospecter",
  en_cours: "En cours",
  relance: "Relance",
  gagne: "Gagne",
  perdu: "Perdu",
  actif: "Actif",
  inactif: "Inactif"
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyee",
  validee: "Validee",
  livree: "Livree",
  payee: "Payee",
  annulee: "Annulee"
};

export const actionStatusLabels: Record<ActionStatus, string> = {
  a_faire: "A faire",
  fait: "Fait",
  annule: "Annule"
};

export const commissionStatusLabels: Record<CommissionStatus, string> = {
  a_venir: "A venir",
  due: "Due",
  payee: "Payee"
};

export const statusTone: Record<string, "neutral" | "blue" | "green" | "amber" | "red"> = {
  a_prospecter: "neutral",
  en_cours: "blue",
  relance: "amber",
  gagne: "green",
  perdu: "red",
  actif: "green",
  inactif: "neutral",
  prospect: "blue",
  client: "green",
  brouillon: "neutral",
  envoyee: "blue",
  validee: "green",
  livree: "green",
  payee: "green",
  annulee: "red",
  a_faire: "amber",
  fait: "green",
  annule: "red",
  a_venir: "blue",
  due: "amber"
};
