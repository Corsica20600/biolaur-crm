import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActionIconButton({
  icon: Icon,
  label,
  asChild,
  children,
  className
}: {
  icon: LucideIcon;
  label: string;
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const classes = cn(
    "focus-ring grid h-9 w-9 place-items-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700",
    className
  );

  if (asChild) {
    return <span className={classes}>{children}</span>;
  }

  return (
    <button type="button" className={classes} aria-label={label} title={label}>
      <Icon className="h-4 w-4" />
    </button>
  );
}
