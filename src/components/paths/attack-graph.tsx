"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { EdgeDocTarget } from "@/lib/bh-edge-docs"
import { shortName } from "@/lib/format"
import type { AclEdge } from "@/lib/graph"
import {
  canonicalNodeId,
  DARK_PALETTE,
  LIGHT_PALETTE,
  type GraphLayoutKind,
  type GraphScope,
} from "@/lib/path-graph"
import { cn } from "@/lib/utils"

const SigmaPathGraph = dynamic(
  () => import("./sigma-graph").then((mod) => mod.SigmaPathGraph),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[560px] w-full rounded-[10px]" />,
  }
)

export function AttackGraph({
  edges,
  onOpenDocs,
}: {
  edges: AclEdge[]
  onOpenDocs: (target: EdgeDocTarget) => void
}) {
  const { resolvedTheme } = useTheme()
  const [layout, setLayout] = useState<GraphLayoutKind>("sequential")
  const [scope, setScope] = useState<GraphScope>("reachable")
  const [selected, setSelected] = useState<string | null>(null)
  const palette = resolvedTheme === "dark" ? DARK_PALETTE : LIGHT_PALETTE
  const incident = useMemo(
    () =>
      selected
        ? edges.filter(
            (edge) =>
              canonicalNodeId(edge.src) === selected ||
              canonicalNodeId(edge.dst) === selected
          )
        : [],
    [edges, selected]
  )
  const selectedLabel = useMemo(() => {
    if (!selected) return ""
    const hit = incident[0]
    if (!hit) return selected
    return canonicalNodeId(hit.src) === selected
      ? shortName(hit.src)
      : shortName(hit.dst)
  }, [incident, selected])

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2.5 rounded-full border border-border bg-foreground/80" />
            用户
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2.5 rotate-45 border border-border bg-foreground/80" />
            组
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2.5 border border-border bg-foreground/80" />
            计算机
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i
              className="size-0 border-x-[5px] border-b-[9px] border-x-transparent border-b-foreground/80"
              style={{ borderTopWidth: 0 }}
            />
            gMSA
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2 rounded-full bg-[#2563eb]" />
            已控
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2 rounded-full border-2 border-[#d97706]" />
            高价值
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-muted p-[3px]">
            <Button
              type="button"
              size="xs"
              variant={scope === "reachable" ? "default" : "ghost"}
              onClick={() => setScope("reachable")}
            >
              当前可达
            </Button>
            <Button
              type="button"
              size="xs"
              variant={scope === "all" ? "default" : "ghost"}
              onClick={() => setScope("all")}
            >
              全部 ACE
            </Button>
          </div>
          <div className="inline-flex rounded-lg bg-muted p-[3px]">
            <Button
              type="button"
              size="xs"
              variant={layout === "sequential" ? "default" : "ghost"}
              onClick={() => setLayout("sequential")}
            >
              顺序
            </Button>
            <Button
              type="button"
              size="xs"
              variant={layout === "force" ? "default" : "ghost"}
              onClick={() => setLayout("force")}
            >
              力导向
            </Button>
          </div>
        </div>
      </div>
      <SigmaPathGraph
        edges={edges}
        layout={layout}
        palette={palette}
        selected={selected}
        scope={scope}
        onSelect={setSelected}
        onOpenDocs={onOpenDocs}
      />
      {selected ? (
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-[12px] text-muted-foreground">
            选中 {selectedLabel}，{incident.length} 条邻边。点边或文档看 BloodHound 官方说明。
          </p>
          <ul className="space-y-2">
            {incident.map((edge) => (
              <li
                key={edge.uid}
                className="flex min-w-0 items-center justify-between gap-2 rounded-[10px] border border-border bg-muted/40 px-3 py-2"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "max-w-[200px] truncate rounded-md border px-2 py-0.5 font-mono text-[12px]",
                      canonicalNodeId(edge.src) === selected
                        ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
                        : "border-border bg-card"
                    )}
                  >
                    {shortName(edge.src)}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {edge.right}
                  </span>
                  <span
                    className={cn(
                      "max-w-[200px] truncate rounded-md border px-2 py-0.5 font-mono text-[12px]",
                      canonicalNodeId(edge.dst) === selected
                        ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
                        : "border-border bg-card"
                    )}
                  >
                    {shortName(edge.dst)}
                  </span>
                </div>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    onOpenDocs({
                      kinds: [edge.right],
                      src: edge.src,
                      dst: edge.dst,
                    })
                  }
                >
                  文档
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-[12px] text-muted-foreground">
          当前可达从已控身份沿边走下去，其余变淡。点击节点看邻边，点击边上的权限打开 BloodHound 文档。
        </p>
      )}
    </div>
  )
}
