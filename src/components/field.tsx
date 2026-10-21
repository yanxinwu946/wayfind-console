import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export function Field({
  id,
  label,
  hint,
  className,
  children,
}: {
  id: string
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col sm:min-w-[240px]", className)}>
      <Label htmlFor={id} className="mb-2 text-[14px] font-medium">
        {label}
      </Label>
      {children}
      <p className="mt-1 min-h-[16px] text-[11px] leading-4 text-muted-foreground">
        {hint || "\u00a0"}
      </p>
    </div>
  )
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-x-4 gap-y-1 sm:grid-cols-2">
      {children}
    </div>
  )
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:justify-end">{children}</div>
  )
}
