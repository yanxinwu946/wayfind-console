import { cn } from "@/lib/utils"

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(10,10,10,0.04)] dark:shadow-none",
        className
      )}
    >
      <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
        <h2 className="text-[14px] font-semibold">{title}</h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}
