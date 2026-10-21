"use client"

/*
  Ranking: primary = 导入 findings.json; secondary = 载入样例; tertiary = CLI 链接.
  Tokens: page bg / card / foreground / muted-foreground / primary / radius-xl.
  One primary action per page (导入). Sample is outline. No extra accent color.
*/

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowUpRight, Compass, Copy, Play } from "lucide-react"
import { FilePicker } from "@/components/file-picker"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { demoRun } from "@/lib/demo"
import { parseImportFiles, toAuditRun } from "@/lib/parse"
import { useStore } from "@/lib/store"

const CLI_REPO = "https://github.com/yanxinwu946/wayfind"
const CLI_INSTALL = "uv tool install --python 3.12 git+https://github.com/yanxinwu946/wayfind"

export function Gate() {
  const router = useRouter()
  const { addRun } = useStore()
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function importFiles(next: File[]) {
    setFiles(next)
    setError("")
    if (next.length === 0) return
    setPending(true)
    try {
      const parsed = await parseImportFiles(next)
      const run = toAuditRun(parsed, {
        name: next[0]?.name.replace(/\.json$/i, "") || "imported",
        sourceLabel: "导入",
      })
      addRun(run, true)
      toast.success(`已导入 ${run.findings.length} 条发现`)
      router.replace("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "无法解析所选文件")
    } finally {
      setPending(false)
    }
  }

  function loadSample() {
    addRun(demoRun(), true)
    toast.success("已载入样例")
    router.replace("/")
  }

  return (
    <div className="flex h-svh min-w-0 flex-col bg-background p-2">
      <div className="flex h-12 shrink-0 items-center justify-end px-2">
        <ThemeToggle />
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-8">
        <div className="w-full max-w-[720px]">
          <div className="mb-10 text-center">
            <span className="mx-auto mb-4 flex size-10 items-center justify-center rounded-[10px] bg-foreground text-background">
              <Compass className="size-5" />
            </span>
            <h1 className="text-[28px] font-semibold tracking-tight">Wayfind</h1>
            <p className="mx-auto mt-2 max-w-[36em] text-[15px] leading-relaxed text-muted-foreground">
              对着一台域控扫一遍，当前身份能走到哪，一目了然。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="flex flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <h2 className="text-[15px] font-semibold">导入结果</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                把 Wayfind 写出的 findings.json 拖进来。只这一份文件。
              </p>
              <div className="mt-4">
                <FilePicker
                  id="gate-files"
                  name="files"
                  accept="application/json,.json"
                  files={files}
                  invalid={Boolean(error)}
                  onFiles={importFiles}
                />
              </div>
              {error ? (
                <Alert variant="destructive" className="mt-3">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              {pending ? (
                <p className="mt-3 text-[12px] text-muted-foreground">正在导入…</p>
              ) : null}
            </section>

            <section className="flex flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <h2 className="text-[15px] font-semibold">示例数据</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                一份没有真实口令的样例，直接看概览、路径和发现。
              </p>
              <div className="mt-auto pt-6">
                <Button type="button" variant="outline" className="w-full" onClick={loadSample}>
                  <Play />
                  载入样例
                </Button>
              </div>
            </section>
          </div>

          <div className="mt-8 rounded-xl bg-muted/50 px-4 py-3">
            <p className="text-[12px] text-muted-foreground">还没有 findings.json？先扫一遍。</p>
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate font-mono text-[12px]">{CLI_INSTALL}</code>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="复制安装命令"
                onClick={async () => {
                  await navigator.clipboard.writeText(CLI_INSTALL)
                  toast.success("已复制")
                }}
              >
                <Copy />
              </Button>
              <Button type="button" variant="ghost" size="sm" asChild>
                <a href={CLI_REPO} target="_blank" rel="noreferrer">
                  CLI
                  <ArrowUpRight />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
