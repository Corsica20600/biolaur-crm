"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  Leaf,
  Mail,
  Menu,
  Package,
  ReceiptText,
  Search,
  Settings,
  Sparkles,
  Users,
  WalletCards,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: BarChart3 },
  { href: "/crm", label: "CRM", icon: Users },
  { href: "/products", label: "Produits", icon: Package },
  { href: "/price-lists", label: "Tarifs", icon: ReceiptText },
  { href: "/orders", label: "Commandes", icon: ClipboardList },
  { href: "/actions", label: "Actions", icon: Sparkles },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/emails", label: "Emails", icon: Mail },
  { href: "/commissions", label: "Commissions", icon: WalletCards },
  { href: "/settings", label: "Parametres", icon: Settings }
];

type CompanyCard = {
  companyName: string;
  companyAddress: string;
  senderPhone: string;
  senderEmail: string;
};

const defaultCompanyCard: CompanyCard = {
  companyName: "Biolaur Distribution",
  companyAddress: "12 rue des Artisans\n33000 Bordeaux",
  senderPhone: "05 56 00 00 00",
  senderEmail: "commercial@biolaur.fr"
};

export function AppShell({ children, companyCard = defaultCompanyCard }: { children: React.ReactNode; companyCard?: CompanyCard }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "focus-ring group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-950",
              active && "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
            )}
          >
            <Icon className={cn("h-4 w-4 text-gray-400 transition group-hover:text-gray-700", active && "text-emerald-700")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-gray-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-80 border-r border-gray-200 bg-white/95 p-5 shadow-sm backdrop-blur-xl xl:block">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-700 text-white shadow-sm">
            <Leaf className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight text-gray-950">Biolaur CRM</p>
            <p className="text-sm font-medium text-gray-500">Terrain commercial</p>
          </div>
        </div>
        {nav}
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-950">{companyCard.companyName}</p>
          <p className="mt-1 whitespace-pre-line text-xs leading-5 text-gray-500">{companyCard.companyAddress}</p>
          <div className="mt-3 space-y-1 text-xs font-medium text-gray-600">
            <p>{companyCard.senderPhone}</p>
            <p className="truncate">{companyCard.senderEmail}</p>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-xl xl:pl-80">
        <div className="flex h-20 items-center gap-4 px-4 md:px-6 xl:px-8">
          <button className="focus-ring rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm xl:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative hidden max-w-xl flex-1 md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Rechercher un client, produit..."
              className="focus-ring h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-700 shadow-inner shadow-gray-100/40 placeholder:text-gray-400"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="focus-ring grid h-11 w-11 place-items-center rounded-2xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:text-gray-900" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-3 rounded-2xl border border-gray-200 bg-white py-1.5 pl-2 pr-4 shadow-sm sm:flex">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-800">EL</span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-950">Erwan Longin</p>
                <p className="text-xs text-gray-500">Administrateur</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 bg-gray-950/30 backdrop-blur-sm xl:hidden">
          <div className="h-full w-80 max-w-[88vw] bg-white p-5 shadow-2xl">
            <div className="mb-7 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-700 text-white">
                  <Leaf className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold text-gray-950">Biolaur CRM</p>
                  <p className="text-sm text-gray-500">Modules</p>
                </div>
              </div>
              <button className="focus-ring rounded-xl border border-gray-200 p-2 text-gray-600" onClick={() => setOpen(false)} aria-label="Fermer le menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      ) : null}

      <main className="overflow-x-hidden xl:pl-80">
        <div className="mx-auto max-w-[1260px] px-4 py-6 md:px-6 md:py-8 xl:px-8">{children}</div>
      </main>
    </div>
  );
}
