"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatNumber } from "@/lib/format"

export function ResultPager({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
  onPageSize: (size: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const safe = Math.min(page, pages)

  function jump(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next = Number(data.get("jump") || 1)
    if (Number.isFinite(next)) onPage(Math.min(pages, Math.max(1, Math.floor(next))))
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Pagination className="mx-0 w-auto justify-start">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#results"
              text="上一页"
              aria-disabled={safe <= 1}
              className={safe <= 1 ? "pointer-events-none opacity-50" : ""}
              onClick={(event) => {
                event.preventDefault()
                if (safe > 1) onPage(safe - 1)
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="px-2 text-[12px] tabular-nums text-muted-foreground">
              {safe} / {pages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#results"
              text="下一页"
              aria-disabled={safe >= pages}
              className={safe >= pages ? "pointer-events-none opacity-50" : ""}
              onClick={(event) => {
                event.preventDefault()
                if (safe < pages) onPage(safe + 1)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(pageSize)} onValueChange={(value) => onPageSize(Number(value))}>
          <SelectTrigger className="w-[132px]" aria-label="每页数量">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {[10, 20, 50].map((size) => (
              <SelectItem key={size} value={String(size)}>
                每页 {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <form className="flex items-center gap-2" onSubmit={jump}>
          <Input
            name="jump"
            type="number"
            min={1}
            max={pages}
            defaultValue={safe}
            aria-label="跳转到页码"
            className="w-16"
          />
          <Button type="submit" variant="outline">
            跳转
          </Button>
        </form>
        <span className="text-[12px] tabular-nums text-muted-foreground">
          共 {formatNumber(total)} 条
        </span>
      </div>
    </div>
  )
}
