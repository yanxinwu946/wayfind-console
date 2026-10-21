import type { FindingRow, LootIdentity } from "@/lib/types"
import { shortName } from "@/lib/format"

export type AclEdge = {
  uid: string
  src: string
  right: string
  dst: string
  owned: boolean
  composed: boolean
  title: string
  evidence: string
}

export type NextAction = {
  uid: string
  title: string
  asset: string
  flags: string[]
}

function namesOf(value: string): string[] {
  const raw = value.trim()
  if (!raw) return []
  return [raw.toLowerCase(), shortName(raw).toLowerCase()]
}

export function ownedNames(identity: string, loot: LootIdentity[]): Set<string> {
  const set = new Set<string>()
  for (const name of namesOf(identity)) set.add(name)
  for (const item of loot) for (const name of namesOf(item.username)) set.add(name)
  return set
}

function isOwned(src: string, owned: Set<string>): boolean {
  return namesOf(src).some((name) => owned.has(name))
}

export function aclEdges(findings: FindingRow[], identity: string, loot: LootIdentity[]): AclEdge[] {
  const owned = ownedNames(identity, loot)
  const edges: AclEdge[] = []
  for (const finding of findings) {
    const extra = finding.extra ?? {}
    const right = String(extra.right ?? "")
    const src = String(extra.src ?? extra.reader ?? "")
    const dst = String(extra.dst ?? finding.asset ?? "")
    if (!src || !right || !dst) continue
    if (!finding.id.startsWith("acl.") && !finding.id.startsWith("hop.")) continue
    edges.push({
      uid: finding.uid,
      src,
      right,
      dst,
      owned: finding.id === "hop.owned-acl" || isOwned(src, owned),
      composed: finding.id.startsWith("hop."),
      title: finding.title,
      evidence: finding.evidence,
    })
  }
  return edges
}

export function nextActions(findings: FindingRow[]): NextAction[] {
  const items: NextAction[] = []
  for (const finding of findings) {
    const next = finding.extra?.next
    if (!Array.isArray(next) || next.length === 0) continue
    items.push({
      uid: finding.uid,
      title: finding.title,
      asset: finding.asset,
      flags: next.map((item) => String(item)),
    })
  }
  return items
}

export function countBy<T>(rows: T[], key: (row: T) => string): { name: string; value: number }[] {
  const map = new Map<string, number>()
  for (const row of rows) {
    const name = key(row) || "未标注"
    map.set(name, (map.get(name) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}
