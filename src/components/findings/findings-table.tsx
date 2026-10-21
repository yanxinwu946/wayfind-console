"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { CopyText } from "@/components/copy-text"
import { SeverityBadge } from "@/components/severity-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BACKEND_LABEL, CHECK_LABEL, labelOf } from "@/lib/labels"
import { dash } from "@/lib/format"
import type { FindingRow } from "@/lib/types"

type SortKey = "severity" | "title" | "asset" | "check" | "backend"

const RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
}

export function FindingsTable({
  rows,
  selected,
  onSelected,
  onOpen,
}: {
  rows: FindingRow[]
  selected: Set<string>
  onSelected: (next: Set<string>) => void
  onOpen: (row: FindingRow) => void
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "severity",
    dir: "asc",
  })

  const ordered = [...rows].sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1
    if (sort.key === "severity") {
      return ((RANK[a.severity] ?? 9) - (RANK[b.severity] ?? 9)) * dir
    }
    return a[sort.key].localeCompare(b[sort.key], "zh-CN") * dir
  })

  const allChecked = rows.length > 0 && rows.every((row) => selected.has(row.uid))

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    )
  }

  function SortHead({ id, label }: { id: SortKey; label: string }) {
    const Icon =
      sort.key !== id ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown
    return (
      <TableHead>
        <button
          type="button"
          className="inline-flex h-full items-center gap-1 text-[12px] font-medium"
          onClick={() => toggleSort(id)}
        >
          {label}
          <Icon className="size-3.5 text-muted-foreground" />
        </button>
      </TableHead>
    )
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-[10px] border border-border">
      <Table className="w-full min-w-[1180px] table-fixed">
        <colgroup>
          <col style={{ width: 48 }} />
          <col style={{ width: 88 }} />
          <col style={{ width: 280 }} />
          <col style={{ width: 220 }} />
          <col style={{ width: 140 }} />
          <col style={{ width: 140 }} />
          <col style={{ width: 132 }} />
          <col style={{ width: 132 }} />
        </colgroup>
        <TableHeader>
          <TableRow className="h-10 hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                aria-label="全选"
                checked={allChecked}
                onCheckedChange={(value) => {
                  onSelected(value ? new Set(rows.map((row) => row.uid)) : new Set())
                }}
              />
            </TableHead>
            <SortHead id="severity" label="优先级" />
            <SortHead id="title" label="标题" />
            <SortHead id="asset" label="对象" />
            <SortHead id="check" label="检查" />
            <SortHead id="backend" label="来源" />
            <TableHead>防护面</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordered.map((row) => (
            <TableRow
              key={row.uid}
              data-state={selected.has(row.uid) ? "selected" : undefined}
              className="h-12"
            >
              <TableCell>
                <Checkbox
                  aria-label={`选择 ${row.title}`}
                  checked={selected.has(row.uid)}
                  onCheckedChange={(value) => {
                    const next = new Set(selected)
                    if (value) next.add(row.uid)
                    else next.delete(row.uid)
                    onSelected(next)
                  }}
                />
              </TableCell>
              <TableCell>
                <SeverityBadge value={row.severity} />
              </TableCell>
              <TableCell className="max-w-0">
                <CopyText value={row.title} />
              </TableCell>
              <TableCell className="max-w-0">
                <CopyText value={row.asset} />
              </TableCell>
              <TableCell className="max-w-0 truncate">
                {labelOf(CHECK_LABEL, row.check)}
              </TableCell>
              <TableCell className="max-w-0 truncate">
                {labelOf(BACKEND_LABEL, row.backend)}
              </TableCell>
              <TableCell className="max-w-0 truncate">{dash(row.opsec)}</TableCell>
              <TableCell className="text-right">
                <Button type="button" variant="ghost" size="sm" onClick={() => onOpen(row)}>
                  详情
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
