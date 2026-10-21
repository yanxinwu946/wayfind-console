"use client"

import { useEffect, useMemo, useState } from "react"
import Markdown, { type Components } from "react-markdown"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  bloodhoundEdgeUrl,
  fetchBloodhoundEdgeDoc,
  type BhEdgeDoc,
  type EdgeDocTarget,
} from "@/lib/bh-edge-docs"
import { shortName } from "@/lib/format"

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h2 className="mt-1 text-[16px] font-semibold first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h3 className="mt-5 text-[14px] font-semibold">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-4 text-[13px] font-semibold">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mt-2 text-[13px] leading-6 text-foreground/90">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-3 hover:text-foreground"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-6">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] leading-6">
      {children}
    </ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  code: ({ className, children, ...props }) => {
    if (className) {
      return (
        <code className="font-mono text-[12px]" {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="mt-2 overflow-x-auto rounded-[10px] bg-muted p-3 font-mono text-[12px] leading-5">
      {children}
    </pre>
  ),
}

export function EdgeDocsDialog({
  target,
  open,
  onOpenChange,
}: {
  target: EdgeDocTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const kinds = target?.kinds ?? []
  const [active, setActive] = useState(kinds[0] ?? "")

  useEffect(() => {
    setActive(target?.kinds[0] ?? "")
  }, [target])

  if (!target || kinds.length === 0) return null
  const pathLabel =
    target.src && target.dst
      ? `${shortName(target.src)} → ${shortName(target.dst)}`
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-32px)] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-3 pr-12">
          <DialogTitle className="text-[14px] font-semibold leading-5">
            BloodHound 利用文档
          </DialogTitle>
          <DialogDescription>
            {pathLabel ? `${pathLabel} · ` : null}
            SpecterOps 官方边说明，未改写。
          </DialogDescription>
        </DialogHeader>
        {kinds.length === 1 ? (
          <EdgeDocBody kind={kinds[0]} />
        ) : (
          <Tabs
            value={active || kinds[0]}
            onValueChange={setActive}
            className="flex min-h-0 flex-1 flex-col gap-0"
          >
            <div className="shrink-0 border-b px-4 py-2">
              <TabsList>
                {kinds.map((kind) => (
                  <TabsTrigger key={kind} value={kind} className="font-mono text-[12px]">
                    {kind}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {kinds.map((kind) => (
              <TabsContent
                key={kind}
                value={kind}
                className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <EdgeDocBody kind={kind} />
              </TabsContent>
            ))}
          </Tabs>
        )}
        <DialogFooter className="mx-0 mb-0 shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button type="button" asChild>
            <a
              href={bloodhoundEdgeUrl(active || kinds[0])}
              target="_blank"
              rel="noreferrer"
            >
              在 BloodHound 打开
              <ExternalLink />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EdgeDocBody({ kind }: { kind: string }) {
  const state = useEdgeDoc(kind)

  if (state.status === "loading") {
    return (
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-5/6" />
      </div>
    )
  }

  if (state.status === "error") {
    const url = bloodhoundEdgeUrl(kind)
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 text-[13px] leading-6">
        <p>没拉到这篇官方文档，可能是边类型没有对应页，或 CDN 暂时不可用。</p>
        <p className="mt-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-3"
          >
            打开 BloodHound {kind} 文档
          </a>
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <Markdown components={markdownComponents}>{state.doc.markdown}</Markdown>
    </div>
  )
}

function useEdgeDoc(kind: string) {
  const [doc, setDoc] = useState<BhEdgeDoc | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    fetchBloodhoundEdgeDoc(kind, controller.signal)
      .then((next) => {
        setDoc(next)
        setLoading(false)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setError(true)
        setLoading(false)
        setDoc(null)
      })
    return () => controller.abort()
  }, [kind])

  return useMemo(() => {
    if (loading) return { status: "loading" as const }
    if (error || !doc) return { status: "error" as const }
    return { status: "ready" as const, doc }
  }, [doc, error, loading])
}
