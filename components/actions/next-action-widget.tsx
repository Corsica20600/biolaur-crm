import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { commercialActions, prospectsClients } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

export function NextActionWidget({ prospectClientId }: { prospectClientId?: string }) {
  const upcoming = commercialActions
    .filter((action) => (!prospectClientId || action.prospectClientId === prospectClientId) && action.nextActionDate)
    .sort((a, b) => String(a.nextActionDate).localeCompare(String(b.nextActionDate)))
    .slice(0, 5);

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-leaf" />
        <h2 className="font-semibold text-ink">Prochaines relances</h2>
      </div>
      <div className="space-y-3">
        {upcoming.map((action) => {
          const record = prospectsClients.find((item) => item.id === action.prospectClientId);
          return (
            <Link key={action.id} href={`/crm/${action.prospectClientId}`} className="block rounded-md border border-line p-3 hover:bg-slate-50">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink">{record?.tradeName}</p>
                <StatusBadge status={action.actionStatus} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{action.summary}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDate(action.nextActionDate)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
