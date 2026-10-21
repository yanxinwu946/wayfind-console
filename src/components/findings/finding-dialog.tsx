"use client"

import { CopyText } from "@/components/copy-text"
import { SeverityBadge } from "@/components/severity-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BACKEND_LABEL, CHECK_LABEL, OPSEC_LABEL, findingKind, labelOf } from "@/lib/labels"
import { dash } from "@/lib/format"
import type { FindingRow } from "@/lib/types"
import { toast } from "sonner"

export function FindingDialog({
  finding,
  open,
  onOpenChange,
}: {
  finding: FindingRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!finding) return null
  const extra = finding.extra ?? {}
  const next = Array.isArray(extra.next) ? extra.next.map(String) : []

  async function copyReplay() {
    if (!finding?.replay) return
    await navigator.clipboard.writeText(finding.replay)
    toast.success("已复制复现命令")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-32px)] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-3 pr-12">
          <DialogTitle className="text-[14px] font-semibold leading-5">{finding.title}</DialogTitle>
          <DialogDescription>
            {findingKind(finding.id)} · {finding.id}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Item label="优先级">
              <SeverityBadge value={finding.severity} />
            </Item>
            <Item label="检查">{labelOf(CHECK_LABEL, finding.check)}</Item>
            <Item label="对象">
              <CopyText value={finding.asset} />
            </Item>
            <Item label="来源">{labelOf(BACKEND_LABEL, finding.backend)}</Item>
            <Item label="防护面">{labelOf(OPSEC_LABEL, finding.opsec)}</Item>
            <Item label="证据" className="sm:col-span-2">
              <CopyText value={finding.evidence} />
            </Item>
            <Item label="复现" className="sm:col-span-2">
              <CopyText value={finding.replay} mono />
            </Item>
            {Object.keys(extra).length > 0 ? (
              <Item label="附加字段" className="sm:col-span-2">
                <pre className="max-h-48 overflow-auto rounded-[10px] bg-muted p-3 font-mono text-[12px] leading-5">
                  {JSON.stringify(extra, null, 2)}
                </pre>
              </Item>
            ) : null}
            {next.length > 0 ? (
              <Item label="下一步" className="sm:col-span-2">
                <ul className="space-y-1 font-mono text-[12px]">
                  {next.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              </Item>
            ) : null}
          </dl>
        </div>
        <DialogFooter className="mx-0 mb-0 shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" disabled={!finding.replay} onClick={copyReplay}>
            复制复现命令
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Item({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 min-w-0 text-[13px]">{children ?? dash("")}</dd>
    </div>
  )
}
