"use client"

import Link from "next/link"
import { AlertTriangle, Flag, GitBranch, KeyRound, List } from "lucide-react"
import { EmptyRun } from "@/components/empty-run"
import { MetricCard, MetricGrid } from "@/components/metric-card"
import { Panel } from "@/components/panel"
import { SeverityBadge } from "@/components/severity-badge"
import { SeverityChart } from "@/components/severity-chart"
import { Button } from "@/components/ui/button"
import { aclEdges, countBy, nextActions } from "@/lib/graph"
import { BACKEND_LABEL, CHECK_LABEL, labelOf } from "@/lib/labels"
import { formatNumber, shortName } from "@/lib/format"
import { useStore } from "@/lib/store"

export default function OverviewPage() {
  const { active } = useStore()
  if (!active) return <EmptyRun />

  const highs = active.findings.filter(
    (item) => item.severity === "high" || item.severity === "critical"
  )
  const edges = aclEdges(active.findings, active.identity, active.loot)
  const owned = edges.filter((edge) => edge.owned)
  const next = nextActions(active.findings)
  const severity = ["high", "medium", "low", "info"].map((name) => ({
    name: labelOf({ high: "高", medium: "中", low: "低", info: "信息" }, name),
    value: active.findings.filter((item) => item.severity === name).length,
  }))
  const backends = countBy(active.findings, (item) => labelOf(BACKEND_LABEL, item.backend))
  const checks = countBy(active.findings, (item) => labelOf(CHECK_LABEL, item.check)).slice(0, 6)

  return (
    <div className="mx-auto flex min-w-0 max-w-[1280px] flex-col gap-4">
      <MetricGrid>
        <MetricCard icon={List} label="发现" value={active.findings.length} hint="findings.json 条目" />
        <MetricCard icon={AlertTriangle} label="高优先级" value={highs.length} hint="high / critical" />
        <MetricCard icon={GitBranch} label="当前身份可走" value={owned.length} hint="owned ACL / hop" />
        <MetricCard icon={KeyRound} label="凭据" value={active.loot.length} hint="loot 与 GPP 明文" />
        <MetricCard icon={Flag} label="下一步" value={next.length} hint="extra.next 提示" />
      </MetricGrid>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="优先级分布">
          <p className="mb-3 text-[11px] text-muted-foreground">
            数据来自当前运行 findings.json，非模拟。
          </p>
          <SeverityChart data={severity} />
        </Panel>
        <Panel title="来源与检查">
          <p className="mb-3 text-[11px] text-muted-foreground">
            backend / check 计数，来自同一份 findings.json。
          </p>
          <ul className="space-y-2">
            {backends.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="truncate">{item.name}</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {formatNumber(item.value)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t pt-3">
            <ul className="space-y-2">
              {checks.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="truncate text-muted-foreground">{item.name}</span>
                  <span className="font-mono tabular-nums">{formatNumber(item.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <Panel
        title="高优先级"
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/findings">查看全部</Link>
          </Button>
        }
      >
        <ul className="divide-y">
          {highs.slice(0, 8).map((item) => (
            <li key={item.uid} className="flex min-w-0 items-start gap-3 py-2.5">
              <SeverityBadge value={item.severity} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{item.title}</div>
                <div className="truncate text-[12px] text-muted-foreground">
                  {shortName(item.asset) === "—" ? item.id : item.asset}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
