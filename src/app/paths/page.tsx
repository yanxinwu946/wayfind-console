"use client"

import { useMemo, useState } from "react"
import { AttackGraph } from "@/components/paths/attack-graph"
import { EdgeDocsDialog } from "@/components/paths/edge-docs-dialog"
import { EmptyRun } from "@/components/empty-run"
import { Panel } from "@/components/panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import type { EdgeDocTarget } from "@/lib/bh-edge-docs"
import { aclEdges } from "@/lib/graph"
import { shortName } from "@/lib/format"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function PathsPage() {
  const { active } = useStore()
  const [docs, setDocs] = useState<EdgeDocTarget | null>(null)
  const edges = useMemo(
    () => (active ? aclEdges(active.findings, active.identity, active.loot) : []),
    [active]
  )
  if (!active) return <EmptyRun />
  const owned = edges.filter((edge) => edge.owned)
  const inventory = edges.filter((edge) => !edge.owned)

  return (
    <div className="mx-auto flex min-w-0 max-w-[1280px] flex-col gap-4">
      <p className="text-[12px] text-muted-foreground">
        从当前身份高亮可达链。边文档来自 SpecterOps 原文。当前身份：{shortName(active.identity)}。
      </p>
      <Panel title="攻击路径图">
        {edges.length === 0 ? (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyTitle>没有可画的边</EmptyTitle>
              <EmptyDescription>这份运行没有 ACL / hop 边。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <AttackGraph edges={edges} onOpenDocs={setDocs} />
        )}
      </Panel>
      <Panel title="当前身份可走">
        {owned.length === 0 ? (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyTitle>没有 owned 边</EmptyTitle>
              <EmptyDescription>当前号没有直接 ACL / hop.owned-acl。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <EdgeList edges={owned} onOpenDocs={setDocs} />
        )}
      </Panel>
      <Panel title="ACL 库存">
        {inventory.length === 0 ? (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyTitle>没有库存边</EmptyTitle>
              <EmptyDescription>这份运行未解析出非默认 ACE。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <EdgeList edges={inventory} onOpenDocs={setDocs} />
        )}
      </Panel>
      <EdgeDocsDialog
        target={docs}
        open={docs !== null}
        onOpenChange={(open) => {
          if (!open) setDocs(null)
        }}
      />
    </div>
  )
}

function EdgeList({
  edges,
  onOpenDocs,
}: {
  edges: ReturnType<typeof aclEdges>
  onOpenDocs: (target: EdgeDocTarget) => void
}) {
  return (
    <ul className="space-y-2">
      {edges.map((edge) => (
        <li
          key={edge.uid}
          className="min-w-0 rounded-[10px] border border-border bg-muted/40 px-3 py-2.5"
        >
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Node name={edge.src} owned={edge.owned} />
                <span className="font-mono text-[11px] text-muted-foreground">
                  {edge.right}
                </span>
                <Node name={edge.dst} />
                {edge.composed ? <Badge variant="outline">合成</Badge> : null}
              </div>
              <p className="mt-1 truncate text-[12px] text-muted-foreground">
                {edge.evidence}
              </p>
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
          </div>
        </li>
      ))}
    </ul>
  )
}

function Node({ name, owned }: { name: string; owned?: boolean }) {
  return (
    <span
      className={cn(
        "max-w-[240px] truncate rounded-md border px-2 py-0.5 font-mono text-[12px]",
        owned
          ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
          : "border-border bg-card"
      )}
    >
      {shortName(name)}
    </span>
  )
}
