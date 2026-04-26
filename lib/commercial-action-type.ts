export const COMMERCIAL_ACTION_TYPES = ["appel", "visite", "relance", "email", "rendez_vous", "note"] as const;

export type CommercialActionType = (typeof COMMERCIAL_ACTION_TYPES)[number];

const ACTION_TYPE_ALIASES: Record<string, CommercialActionType> = {
  appel: "appel",
  call: "appel",
  phone: "appel",
  telephone: "appel",
  tel: "appel",
  visite: "visite",
  visit: "visite",
  relance: "relance",
  relanceauto: "relance",
  relance_auto: "relance",
  followup: "relance",
  follow_up: "relance",
  auto: "relance",
  reassort: "relance",
  prospection: "relance",
  email: "email",
  mail: "email",
  rendezvous: "rendez_vous",
  rendez_vous: "rendez_vous",
  rdv: "rendez_vous",
  meeting: "rendez_vous",
  note: "note",
  notes: "note",
  commentaire: "note"
};

function normalizeActionTypeKey(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z_]/g, "")
    .replaceAll("_", "");
}

export function mapCommercialActionType(value: unknown, fallback: CommercialActionType = "relance"): CommercialActionType {
  const key = normalizeActionTypeKey(value);
  if (!key) return fallback;
  return ACTION_TYPE_ALIASES[key] ?? fallback;
}

export function normalizeCommercialActionType(value: string | null | undefined) {
  return mapCommercialActionType(value, "relance");
}
