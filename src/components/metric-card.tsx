import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  hint: string
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(10,10,10,0.04)] dark:shadow-none">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        <span className="truncate text-[12px]">{label}</span>
      </div>
      <div className="mt-2 font-mono text-[22px] font-semibold tabular-nums leading-none tracking-tight">
        {formatNumber(value)}
      </div>
      <p className="mt-2 truncate text-[11px] text-muted-foreground">{hint}</p>
    </div>
  )
}

export function MetricGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-5",
        "[&>*:last-child]:max-xl:col-span-2"
      )}
    >
      {children}
    </div>
  )
}
