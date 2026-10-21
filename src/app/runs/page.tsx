"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { FilePicker } from "@/components/file-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { exportRun } from "@/lib/export-run"
import { dash, formatBeijing, formatNumber, shortName } from "@/lib/format"
import { PROFILE_LABEL, labelOf } from "@/lib/labels"
import { parseImportFiles, toAuditRun, type ParseResult } from "@/lib/parse"
import { useStore } from "@/lib/store"

export default function RunsPage() {
  const {
    runs,
    active,
    addRun,
    removeRun,
    renameRun,
    setActive,
    clearRuns,
  } = useStore()
  const [name, setName] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [preview, setPreview] = useState<ParseResult | null>(null)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [clearOpen, setClearOpen] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  useEffect(() => {
    if (files.length === 0) {
      setPreview(null)
      setError("")
      setName("")
      return
    }
    let cancelled = false
    parseImportFiles(files)
      .then((result) => {
        if (cancelled) return
        setPreview(result)
        setError("")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setPreview(null)
        setError(err instanceof Error ? err.message : "无法解析所选文件")
      })
    return () => {
      cancelled = true
    }
  }, [files])

  function resetForm() {
    setName("")
    setFiles([])
    setPreview(null)
    setError("")
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!preview) {
      setError("请选择 findings.json")
      return
    }
    setPending(true)
    try {
      const run = toAuditRun(preview, {
        name: name.trim() || files[0]?.name.replace(/\.json$/i, "") || "imported",
        sourceLabel: "导入",
      })
      addRun(run, true)
      const skip = preview.skipped ? `，跳过 ${preview.skipped} 条` : ""
      toast.success(`已导入 ${run.findings.length} 条发现${skip}`)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "导入失败")
    } finally {
      setPending(false)
    }
  }

  const renaming = runs.find((run) => run.id === renameId) ?? null

  return (
    <div className="mx-auto flex min-w-0 max-w-[1280px] flex-col gap-4">
      {active ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="当前身份"
            value={shortName(active.identity)}
            hint={`${dash(active.domain)} · ${dash(active.dcHost)}`}
          />
          <Stat
            label="配置"
            value={labelOf(PROFILE_LABEL, active.profile)}
            hint={active.name}
          />
          <Stat
            label="发现 / 凭据"
            value={`${formatNumber(active.findings.length)} / ${formatNumber(active.loot.length)}`}
            hint={`本机 ${formatNumber(runs.length)} 次运行`}
          />
          <Stat
            label="导入时间"
            value={formatBeijing(active.importedAt)}
            hint="北京时间"
          />
        </div>
      ) : null}

      <form
        className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(10,10,10,0.04)] dark:shadow-none"
        onSubmit={onSubmit}
      >
        <h2 className="text-[14px] font-semibold">导入运行</h2>
        <div className="mt-3">
          <FilePicker
            id="files"
            name="files"
            accept="application/json,.json"
            files={files}
            invalid={Boolean(error)}
            onFiles={setFiles}
          />
        </div>
        {error ? (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {preview ? (
          <>
            <p className="mt-2 text-[12px] text-muted-foreground">
              发现 {formatNumber(preview.findings.length)} · 凭据{" "}
              {formatNumber(preview.loot.length)}
              {preview.skipped ? ` · 跳过 ${formatNumber(preview.skipped)}` : ""}
              {" · "}
              {shortName(preview.identity) || "未知身份"}
              {preview.domain ? ` · ${preview.domain}` : ""}
              {preview.profile ? ` · ${labelOf(PROFILE_LABEL, preview.profile)}` : ""}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex min-w-0 w-full max-w-md flex-col">
                <Label htmlFor="name" className="mb-2 text-[14px] font-medium">
                  运行名称
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  placeholder={files[0]?.name.replace(/\.json$/i, "") || "运行名称"}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                {pending ? "导入中…" : "导入"}
              </Button>
            </div>
          </>
        ) : null}
      </form>

      <section id="results" className="scroll-mt-2">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[14px] font-semibold">
            已保存运行
            <span className="ml-2 font-mono text-[12px] font-normal tabular-nums text-muted-foreground">
              {formatNumber(runs.length)}
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={runs.length === 0}
              onClick={() => setClearOpen(true)}
            >
              清空库存
            </Button>
          </div>
        </div>
        {runs.length === 0 ? (
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyTitle>没有运行</EmptyTitle>
              <EmptyDescription>导入 findings.json 后会出现在这里。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="min-w-0 overflow-hidden rounded-[10px] border">
            <Table className="w-full min-w-[1080px] table-fixed">
              <colgroup>
                <col style={{ width: 180 }} />
                <col style={{ width: 140 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 128 }} />
                <col style={{ width: 64 }} />
                <col style={{ width: 64 }} />
                <col style={{ width: 160 }} />
                <col style={{ width: 200 }} />
              </colgroup>
              <TableHeader>
                <TableRow className="h-10">
                  <TableHead>名称</TableHead>
                  <TableHead>身份</TableHead>
                  <TableHead>域</TableHead>
                  <TableHead>配置</TableHead>
                  <TableHead className="text-right">发现</TableHead>
                  <TableHead className="text-right">凭据</TableHead>
                  <TableHead>导入时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow
                    key={run.id}
                    data-state={active?.id === run.id ? "selected" : undefined}
                    className="h-12 cursor-pointer"
                    onClick={() => {
                      if (active?.id !== run.id) setActive(run.id)
                    }}
                  >
                    <TableCell className="truncate font-medium">{run.name}</TableCell>
                    <TableCell className="truncate">{shortName(run.identity)}</TableCell>
                    <TableCell className="truncate">{dash(run.domain)}</TableCell>
                    <TableCell className="truncate">
                      {labelOf(PROFILE_LABEL, run.profile)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatNumber(run.findings.length)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatNumber(run.loot.length)}
                    </TableCell>
                    <TableCell className="font-mono text-[12px] tabular-nums">
                      {formatBeijing(run.importedAt)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            exportRun(run)
                            toast.success("已导出")
                          }}
                        >
                          导出
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRenameId(run.id)
                            setRenameValue(run.name)
                          }}
                        >
                          重命名
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveId(run.id)}
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <AlertDialog open={Boolean(removeId)} onOpenChange={() => setRemoveId(null)}>
        <AlertDialogContent className="max-h-[calc(100vh-32px)]">
          <AlertDialogHeader>
            <AlertDialogTitle>删除运行</AlertDialogTitle>
            <AlertDialogDescription>
              从本机库存移除该运行，不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removeId) removeRun(removeId)
                setRemoveId(null)
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent className="max-h-[calc(100vh-32px)]">
          <AlertDialogHeader>
            <AlertDialogTitle>清空库存</AlertDialogTitle>
            <AlertDialogDescription>
              移除本机全部运行，当前视图会空出来。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearRuns()
                setClearOpen(false)
                toast.success("已清空本机运行")
              }}
            >
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(renaming)}
        onOpenChange={(open) => {
          if (!open) setRenameId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名运行</DialogTitle>
            <DialogDescription>只改本机显示名称，不改 findings 内容。</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            autoFocus
            onChange={(event) => setRenameValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && renameId && renameValue.trim()) {
                renameRun(renameId, renameValue.trim())
                setRenameId(null)
                toast.success("已重命名")
              }
            }}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameId(null)}>
              取消
            </Button>
            <Button
              type="button"
              disabled={!renameValue.trim()}
              onClick={() => {
                if (!renameId || !renameValue.trim()) return
                renameRun(renameId, renameValue.trim())
                setRenameId(null)
                toast.success("已重命名")
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="min-w-0 rounded-[10px] border border-border bg-card p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-[13px] font-medium">{value}</div>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">{hint}</p>
    </div>
  )
}
