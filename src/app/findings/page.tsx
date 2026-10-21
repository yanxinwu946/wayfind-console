"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { EmptyRun } from "@/components/empty-run"
import { FilterForm } from "@/components/findings/filter-form"
import { FindingDialog } from "@/components/findings/finding-dialog"
import { FindingsTable } from "@/components/findings/findings-table"
import { ResultPager } from "@/components/findings/result-pager"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { applyFindingsQuery, uniqueValues } from "@/lib/filter"
import { formatNumber } from "@/lib/format"
import { useStore } from "@/lib/store"
import type { FindingRow } from "@/lib/types"

export default function FindingsPage() {
  const { active, query, draft, setDraft, applyQuery, resetQuery } = useStore()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<FindingRow | null>(null)

  const filtered = useMemo(
    () => (active ? applyFindingsQuery(active, query) : []),
    [active, query]
  )
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pages)
  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  if (!active) return <EmptyRun />

  function exportRows(rows: FindingRow[]) {
    const blob = new Blob(
      [JSON.stringify({ findings: rows.map(({ uid: _uid, ...rest }) => rest) }, null, 2)],
      { type: "application/json" }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "findings-export.json"
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`已导出 ${rows.length} 条`)
  }

  function changePage(next: number) {
    setPage(next)
    const results = document.getElementById("results")
    results?.querySelectorAll("[data-slot='table-container']").forEach((el) => {
      el.scrollLeft = 0
    })
    results?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="mx-auto flex min-w-0 max-w-[1280px] flex-col gap-4">
      <FilterForm
        draft={draft}
        applied={query}
        options={{
          checks: uniqueValues(active.findings, "check"),
          backends: uniqueValues(active.findings, "backend"),
        }}
        onChange={setDraft}
        onSubmit={() => {
          applyQuery()
          setPage(1)
          setSelected(new Set())
        }}
        onReset={() => {
          resetQuery()
          setPage(1)
          setSelected(new Set())
        }}
      />

      <section id="results" className="scroll-mt-2">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[14px] font-semibold">
            结果
            <span className="ml-2 font-mono text-[12px] font-normal tabular-nums text-muted-foreground">
              {formatNumber(filtered.length)}
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={selected.size === 0}
              onClick={() =>
                exportRows(filtered.filter((row) => selected.has(row.uid)))
              }
            >
              导出选中
            </Button>
            <Button type="button" variant="outline" onClick={() => exportRows(filtered)}>
              导出结果
            </Button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyTitle>没有匹配的发现</EmptyTitle>
              <EmptyDescription>调整条件后重新提交检索。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3">
            <FindingsTable
              rows={slice}
              selected={selected}
              onSelected={setSelected}
              onOpen={setOpen}
            />
            <ResultPager
              page={safePage}
              pageSize={pageSize}
              total={filtered.length}
              onPage={changePage}
              onPageSize={(size) => {
                setPageSize(size)
                setPage(1)
              }}
            />
          </div>
        )}
      </section>
      <FindingDialog finding={open} open={Boolean(open)} onOpenChange={() => setOpen(null)} />
    </div>
  )
}
