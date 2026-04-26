"use client";

import { Send } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { sendCrmEmail } from "@/actions/email";

type EmailTemplateOption = {
  id: string;
  code: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
};

type EmailRecipientOption = {
  id: string;
  label: string;
  companyName: string;
  email: string;
};

type EmailOrderOption = {
  id: string;
  orderNumber: string;
  clientId: string;
};

type EmailProductDocumentOption = {
  id: string;
  productId: string;
  documentType: string;
  title: string;
  fileName?: string;
  storagePath?: string;
  publicUrl?: string;
  productReference?: string;
  productName?: string;
};

type StaticAttachmentOption = {
  key: "account_opening_form" | "pricing_sheet";
  label: string;
};

type EmailComposerData = {
  templates: EmailTemplateOption[];
  recipients: EmailRecipientOption[];
  orders: EmailOrderOption[];
  productDocuments: EmailProductDocumentOption[];
};

const emptyData: EmailComposerData = {
  templates: [],
  recipients: [],
  orders: [],
  productDocuments: []
};

const staticAttachmentOptions: StaticAttachmentOption[] = [
  { key: "account_opening_form", label: "Formulaire ouverture de compte (pre-rempli)" },
  { key: "pricing_sheet", label: "Tarif BIOLAUR SP 2026 - V2 CORSE" }
];

const DEFAULT_BODIES_BY_CODE: Record<string, string> = {
  send_technical_sheet:
    "Bonjour,\n\nSuite a notre echange, vous trouverez en pieces jointes les documents demandes.\n\nJe reste a votre disposition pour toute information complementaire, un devis personnalise ou un accompagnement sur vos besoins.\n\nCordialement,\nErwan Longin\nBiolaur Distribution",
  send_order:
    "Bonjour,\n\nVeuillez trouver ci-joint votre bon de commande.\n\nJe reste a votre disposition pour toute precision ou modification eventuelle.\n\nCordialement,\nErwan Longin\nBiolaur Distribution"
};

const LEGACY_TEMPLATE_BODIES = [
  "Bonjour,\n\nVeuillez trouver ci-joint les fiches techniques demandées.\n\nCordialement",
  "Bonjour,\n\nVeuillez trouver ci-joint votre bon de commande.\n\nCordialement",
  "Bonjour,\n\nVeuillez trouver ci-joint les fiches techniques demandees.\n\nCordialement",
  "Bonjour,\n\nVeuillez trouver ci-joint votre bon de commande.\n\nCordialement"
];

function normalizeEmailBody(body: string) {
  return body.replace(/\\n/g, "\n");
}

function resolveTemplateBody(template: EmailTemplateOption | undefined) {
  if (!template) return DEFAULT_BODIES_BY_CODE.send_technical_sheet;
  const normalizedBody = normalizeEmailBody(template.bodyTemplate || "");
  if (!normalizedBody.trim()) return DEFAULT_BODIES_BY_CODE[template.code] ?? DEFAULT_BODIES_BY_CODE.send_technical_sheet;
  if (LEGACY_TEMPLATE_BODIES.includes(normalizedBody)) return DEFAULT_BODIES_BY_CODE[template.code] ?? normalizedBody;
  return normalizedBody;
}

export function EmailComposer({ prospectClientId, orderId }: { prospectClientId?: string; orderId?: string }) {
  const [data, setData] = useState<EmailComposerData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState(prospectClientId ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      const response = await fetch("/api/emails/data", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as ({ ok: true } & EmailComposerData) | { ok: false; error: string } | null;
      if (!active) return;

      if (!payload?.ok) {
        setMessage({ type: "error", text: payload?.error ?? "Chargement des donnees email impossible." });
        setLoading(false);
        return;
      }

      setData({
        templates: payload.templates.map((template) => ({
          ...template,
          bodyTemplate: normalizeEmailBody(template.bodyTemplate)
        })),
        recipients: payload.recipients,
        orders: payload.orders,
        productDocuments: payload.productDocuments
      });
      setLoading(false);
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const selectedOrder = useMemo(() => data.orders.find((item) => item.id === orderId), [data.orders, orderId]);
  const selectedRecipient = useMemo(() => {
    const preferredId = selectedClientId || selectedOrder?.clientId;
    return data.recipients.find((item) => item.id === preferredId) ?? data.recipients[0];
  }, [data.recipients, selectedClientId, selectedOrder?.clientId]);
  const selectedTemplate = useMemo(() => {
    const defaultCode = selectedOrder ? "send_order" : "send_technical_sheet";
    return data.templates.find((item) => item.id === selectedTemplateId) ?? data.templates.find((item) => item.code === defaultCode) ?? data.templates[0];
  }, [data.templates, selectedOrder, selectedTemplateId]);

  useEffect(() => {
    if (!selectedRecipient) return;
    setSelectedClientId((current) => current || selectedRecipient.id);
    setTo((current) => current || selectedRecipient.email);
  }, [selectedRecipient]);

  useEffect(() => {
    if (!selectedTemplate) return;
    setSelectedTemplateId((current) => current || selectedTemplate.id);
    setSubject(selectedTemplate.subjectTemplate);
    setBody(resolveTemplateBody(selectedTemplate));
  }, [selectedTemplate]);

  useEffect(() => {
    if (orderId) setSelectedAttachments((current) => (current.includes(`order_pdf:${orderId}`) ? current : [`order_pdf:${orderId}`, ...current]));
  }, [orderId]);

  const technicalSheets = data.productDocuments.filter((doc) => doc.documentType === "fiche_technique").slice(0, 12);

  function toggleAttachment(value: string, checked: boolean) {
    setSelectedAttachments((current) => {
      if (checked) return current.includes(value) ? current : [...current, value];
      return current.filter((item) => item !== value);
    });
  }

  function handleTemplateChange(templateId: string) {
    const template = data.templates.find((item) => item.id === templateId);
    setSelectedTemplateId(templateId);
    if (template) {
      setSubject(template.subjectTemplate);
      setBody(resolveTemplateBody(template));
    }
  }

  function handleRecipientChange(clientId: string) {
    const recipient = data.recipients.find((item) => item.id === clientId);
    setSelectedClientId(clientId);
    if (recipient?.email) setTo(recipient.email);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await sendCrmEmail({
        prospectClientId: selectedClientId,
        clientId: selectedClientId,
        orderId,
        templateId: selectedTemplateId,
        to,
        subject,
        body,
        attachments: selectedAttachments.map((value) => {
          const [type, id] = value.split(":");
          return { type: type as "product_document" | "order_pdf" | "account_opening_form" | "pricing_sheet", id };
        })
      });

      if (result.ok) {
        setMessage({ type: "success", text: result.message });
        window.dispatchEvent(new CustomEvent("biolaur:email-sent"));
      } else {
        const detailText =
          result.details && typeof result.details === "object" && "message" in result.details
            ? String((result.details as { message?: string }).message ?? "")
            : "";
        setMessage({ type: "error", text: detailText ? `${result.message} (${detailText})` : result.message });
      }
    });
  }

  if (loading) {
    return <div className="rounded-lg border border-line bg-white p-4 text-sm text-slate-500">Chargement du composeur email...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6 rounded-lg border border-line bg-white p-5 lg:p-6">
      <input type="hidden" name="prospectClientId" value={selectedClientId} />
      <input type="hidden" name="orderId" value={orderId ?? ""} />
      <div className="grid gap-4 md:grid-cols-3">
        <label>
          <span className="mb-1 block text-sm font-medium text-slate-700">Client / prospect</span>
          <select value={selectedClientId} onChange={(event) => handleRecipientChange(event.target.value)} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm">
            {data.recipients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-slate-700">Destinataire</span>
          <input value={to} onChange={(event) => setTo(event.target.value)} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm" />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-slate-700">Template</span>
          <select value={selectedTemplateId} onChange={(event) => handleTemplateChange(event.target.value)} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm">
            {data.templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">Objet</span>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">Message</span>
            <textarea value={body} onChange={(event) => setBody(event.target.value)} className="focus-ring min-h-[360px] w-full rounded-md border border-line px-4 py-3 text-sm leading-6" />
          </label>
        </div>
        <aside className="rounded-lg border border-line bg-slate-50/60 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">Pieces jointes historisees</p>
          <div className="space-y-2">
            {selectedOrder ? (
              <label className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedAttachments.includes(`order_pdf:${selectedOrder.id}`)}
                  onChange={(event) => toggleAttachment(`order_pdf:${selectedOrder.id}`, event.target.checked)}
                />
                <span>{selectedOrder.orderNumber}.pdf</span>
              </label>
            ) : null}
            {technicalSheets.map((doc) => (
              <label key={doc.id} className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedAttachments.includes(`product_document:${doc.id}`)}
                  onChange={(event) => toggleAttachment(`product_document:${doc.id}`, event.target.checked)}
                />
                <span>{doc.productReference ? `${doc.productReference} - ` : ""}{doc.title}</span>
              </label>
            ))}
            {staticAttachmentOptions.map((attachment) => (
              <label key={attachment.key} className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedAttachments.includes(`${attachment.key}:${attachment.key}`)}
                  onChange={(event) => toggleAttachment(`${attachment.key}:${attachment.key}`, event.target.checked)}
                />
                <span>{attachment.label}</span>
              </label>
            ))}
          </div>
        </aside>
      </div>
      <div className="space-y-3">
        {message ? (
          <p className={message.type === "success" ? "rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700" : "rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700"}>
            {message.text}
          </p>
        ) : null}
        <div>
          <button disabled={isPending} type="submit" className="focus-ring inline-flex items-center gap-2 rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">
            <Send className="h-4 w-4" />
            {isPending ? "Envoi..." : "Envoyer et historiser"}
          </button>
        </div>
      </div>
    </form>
  );
}
