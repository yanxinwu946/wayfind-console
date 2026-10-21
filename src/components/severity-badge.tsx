import { Badge } from "@/components/ui/badge"
import { SEVERITY_LABEL } from "@/lib/labels"
import { cn } from "@/lib/utils"

const TONE: Record<string, string> = {
  critical: "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  high: "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  medium:
    "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  low: "border-transparent bg-muted text-muted-foreground",
  info: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
}

export function SeverityBadge({
  value,
  severity,
}: {
  value?: string
  severity?: string
}) {
  const key = (value || severity || "info").toLowerCase()
  return (
    <Badge variant="outline" className={cn("font-medium", TONE[key] ?? TONE.info)}>
      {SEVERITY_LABEL[key] ?? key}
    </Badge>
  )
}
