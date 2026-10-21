"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { CopyText } from "@/components/copy-text"
import { EmptyRun } from "@/components/empty-run"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { dash } from "@/lib/format"
import { useStore } from "@/lib/store"

export default function LootPage() {
  const { active } = useStore()
  const [show, setShow] = useState<Record<string, boolean>>({})
  if (!active) return <EmptyRun />

  if (active.loot.length === 0) {
    return (
      <Empty className="min-h-[360px] border">
        <EmptyHeader>
          <EmptyTitle>没有凭据</EmptyTitle>
          <EmptyDescription>
            当前运行没有凭据，也没有从 GPP cpassword 解出的明文。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="mx-auto min-w-0 max-w-[1280px]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[14px] font-semibold">凭据</h2>
      </div>
      <div className="min-w-0 overflow-hidden rounded-[10px] border">
        <Table className="w-full min-w-[880px] table-fixed">
          <colgroup>
            <col style={{ width: 200 }} />
            <col style={{ width: 220 }} />
            <col style={{ width: 200 }} />
            <col style={{ width: 128 }} />
            <col style={{ width: 132 }} />
          </colgroup>
          <TableHeader>
            <TableRow className="h-10">
              <TableHead>账户</TableHead>
              <TableHead>口令</TableHead>
              <TableHead>哈希</TableHead>
              <TableHead>来源</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.loot.map((item) => {
              const visible = show[item.username]
              return (
                <TableRow key={item.username} className="h-12">
                  <TableCell>
                    <CopyText value={item.username} />
                  </TableCell>
                  <TableCell className="font-mono text-[12px]">
                    {item.password
                      ? visible
                        ? <CopyText value={item.password} mono />
                        : "••••••••"
                      : dash("")}
                  </TableCell>
                  <TableCell className="max-w-0">
                    <CopyText value={item.hashes ?? ""} mono />
                  </TableCell>
                  <TableCell>{dash(item.source)}</TableCell>
                  <TableCell className="text-right">
                    {item.password ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={visible ? "隐藏口令" : "显示口令"}
                        onClick={() =>
                          setShow((prev) => ({
                            ...prev,
                            [item.username]: !prev[item.username],
                          }))
                        }
                      >
                        {visible ? <EyeOff /> : <Eye />}
                      </Button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
