"use client"

import { Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { dash } from "@/lib/format"
import { cn } from "@/lib/utils"

export function CopyText({
  value,
  className,
  mono = false,
}: {
  value?: string | null
  className?: string
  mono?: boolean
}) {
  const text = dash(value)
  const copyable = Boolean(value && value.trim())

  async function copy() {
    if (!copyable) return
    await navigator.clipboard.writeText(value!)
    toast.success("已复制")
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("min-w-0 flex-1 truncate", mono && "font-mono text-[12px]")}>
            {text}
          </span>
        </TooltipTrigger>
        {copyable ? (
          <TooltipContent side="top" className="max-w-sm break-all">
            {value}
          </TooltipContent>
        ) : null}
      </Tooltip>
      {copyable ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="复制"
          className="shrink-0"
          onClick={copy}
        >
          <Copy />
        </Button>
      ) : null}
    </div>
  )
}
