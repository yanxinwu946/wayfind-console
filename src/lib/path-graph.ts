import { Graph as DagreGraph, layout as dagreLayout } from "@dagrejs/dagre"
import { MultiDirectedGraph } from "graphology"
import { circular, random } from "graphology-layout"
import forceAtlas2 from "graphology-layout-forceatlas2"
import type { AclEdge } from "@/lib/graph"
import { shortName } from "@/lib/format"

export type GraphLayoutKind = "sequential" | "force"
export type GraphScope = "reachable" | "all"
export type NodeKind = "user" | "group" | "computer" | "gmsa"

export const NODE_KIND_LABEL: Record<NodeKind, string> = {
  user: "用户",
  group: "组",
  computer: "计算机",
  gmsa: "gMSA",
}

export const NODE_KIND_SHAPE: Record<NodeKind, "circle" | "diamond" | "square" | "triangle"> = {
  user: "circle",
  group: "diamond",
  computer: "square",
  gmsa: "triangle",
}

const TIER_ZERO = new Set([
  "administrators",
  "account operators",
  "backup operators",
  "domain admins",
  "domain controllers",
  "enterprise admins",
  "enterprise domain controllers",
  "group policy creator owners",
  "krbtgt",
  "print operators",
  "read-only domain controllers",
  "replicator",
  "schema admins",
  "server operators",
  "adminsdholder",
  "enterprise key admins",
  "key admins",
  "cryptographic operators",
])

const GROUP_DEST_RIGHTS = new Set(["AddMember", "AddSelf", "MemberOf"])
const USER_DEST_RIGHTS = new Set(["ForceChangePassword", "WriteSPN"])

export type GraphPalette = {
  node: string
  owned: string
  highValue: string
  edge: string
  ownedEdge: string
  composedEdge: string
  dim: string
  label: string
  edgeLabel: string
  halo: string
  backdrop: string
  backdropShadow: string
  labelBg: string
}

export type PathNodeAttrs = {
  x: number
  y: number
  label: string
  size: number
  color: string
  halo: string
  shape: "circle" | "diamond" | "square" | "triangle"
  kind: NodeKind
  owned: boolean
  highValue: boolean
  reachable: boolean
}

export type PathEdgeAttrs = {
  label: string
  rights: string[]
  size: number
  color: string
  owned: boolean
  composed: boolean
  reachable: boolean
  evidence: string
}

export type PathGraph = MultiDirectedGraph<PathNodeAttrs, PathEdgeAttrs>

export function canonicalNodeId(name: string): string {
  return shortName(name).trim().toLowerCase()
}

export function isHighValue(name: string): boolean {
  return TIER_ZERO.has(shortName(name).trim().toLowerCase())
}

export function inferNodeKind(name: string, edges: AclEdge[]): NodeKind {
  const id = canonicalNodeId(name)
  const label = shortName(name)
  const incoming = edges
    .filter((edge) => canonicalNodeId(edge.dst) === id)
    .map((edge) => edge.right)
  if (incoming.includes("ReadGMSAPassword") || /^gmsa/i.test(label)) return "gmsa"
  if (label.endsWith("$")) return "computer"
  if (incoming.some((right) => GROUP_DEST_RIGHTS.has(right))) return "group"
  if (incoming.some((right) => USER_DEST_RIGHTS.has(right))) return "user"
  if (label.toLowerCase() === "krbtgt") return "user"
  if (isHighValue(label) && !label.endsWith("$")) return "group"
  if (/^svc[-_]/i.test(label)) return "user"
  if (!label.includes(".") && /^[A-Z0-9]+(?:-[A-Z0-9]+)+$/.test(label)) return "group"
  if (!label.includes(".") && / /.test(label) && label === label.toUpperCase()) return "group"
  return "user"
}

export function reachableNodeIds(edges: AclEdge[]): Set<string> {
  const seeds = new Set<string>()
  for (const edge of edges) {
    if (edge.owned) seeds.add(canonicalNodeId(edge.src))
  }
  const adj = new Map<string, string[]>()
  for (const edge of edges) {
    const src = canonicalNodeId(edge.src)
    const dst = canonicalNodeId(edge.dst)
    const list = adj.get(src)
    if (list) list.push(dst)
    else adj.set(src, [dst])
  }
  const seen = new Set<string>(seeds)
  const queue = [...seeds]
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break
    for (const next of adj.get(current) ?? []) {
      if (seen.has(next)) continue
      seen.add(next)
      queue.push(next)
    }
  }
  return seen
}

export function buildPathGraph(edges: AclEdge[], palette: GraphPalette): PathGraph {
  const graph: PathGraph = new MultiDirectedGraph()
  const groups = new Map<
    string,
    {
      srcId: string
      dstId: string
      srcLabel: string
      dstLabel: string
      rights: string[]
      owned: boolean
      composed: boolean
      evidence: string
    }
  >()

  for (const edge of edges) {
    const srcId = canonicalNodeId(edge.src)
    const dstId = canonicalNodeId(edge.dst)
    if (!srcId || !dstId) continue
    const key = `${srcId}\0${dstId}`
    const existing = groups.get(key)
    if (existing) {
      if (!existing.rights.includes(edge.right)) existing.rights.push(edge.right)
      existing.owned = existing.owned || edge.owned
      existing.composed = existing.composed || edge.composed
      if (edge.owned || edge.composed) existing.evidence = edge.evidence
      continue
    }
    groups.set(key, {
      srcId,
      dstId,
      srcLabel: shortName(edge.src),
      dstLabel: shortName(edge.dst),
      rights: [edge.right],
      owned: edge.owned,
      composed: edge.composed,
      evidence: edge.evidence,
    })
  }

  const ownedNodes = new Set<string>()
  for (const group of groups.values()) {
    if (group.owned) ownedNodes.add(group.srcId)
  }
  const reachable = reachableNodeIds(edges)
  const reach = reachable.size > 0 ? reachable : new Set([...groups.values()].flatMap((g) => [g.srcId, g.dstId]))

  const addNode = (id: string, label: string) => {
    if (graph.hasNode(id)) return
    const owned = ownedNodes.has(id)
    const highValue = isHighValue(label)
    const kind = inferNodeKind(label, edges)
    graph.addNode(id, {
      x: 0,
      y: 0,
      label,
      size: owned ? 16 : highValue ? 15 : 12,
      color: owned ? palette.owned : palette.node,
      halo: highValue ? palette.highValue : palette.halo,
      shape: NODE_KIND_SHAPE[kind],
      kind,
      owned,
      highValue,
      reachable: reach.has(id),
    })
  }

  for (const group of groups.values()) {
    addNode(group.srcId, group.srcLabel)
    addNode(group.dstId, group.dstLabel)
    const owned = group.owned
    const composed = group.composed
    graph.addEdgeWithKey(`${group.srcId}->${group.dstId}`, group.srcId, group.dstId, {
      label: group.rights.join(" · "),
      rights: group.rights,
      size: owned || composed ? 2 : 1.4,
      color: owned ? palette.ownedEdge : composed ? palette.composedEdge : palette.edge,
      owned,
      composed,
      reachable: reach.has(group.srcId),
      evidence: group.evidence,
    })
  }

  return graph
}

export function applyPathLayout(graph: PathGraph, kind: GraphLayoutKind): void {
  if (graph.order === 0) return
  if (kind === "force") {
    random.assign(graph, { scale: 140 })
    forceAtlas2.assign(graph, {
      iterations: Math.min(240, 80 + graph.order * 10),
      settings: {
        ...forceAtlas2.inferSettings(graph),
        gravity: 0.7,
        scalingRatio: 14,
        slowDown: 2.4,
      },
    })
    return
  }
  try {
    const dagreGraph = new DagreGraph({ directed: true, multigraph: true })
    dagreGraph.setGraph({
      rankdir: "LR",
      nodesep: 96,
      ranksep: 220,
      edgesep: 36,
      marginx: 48,
      marginy: 64,
    })
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    graph.forEachNode((id) => {
      dagreGraph.setNode(id, { width: 220, height: 88 })
    })
    graph.forEachEdge((_id, _attrs, source, target) => {
      dagreGraph.setEdge(source, target)
    })
    dagreLayout(dagreGraph)
    graph.forEachNode((id) => {
      const placed = dagreGraph.node(id)
      if (!placed) return
      graph.setNodeAttribute(id, "x", placed.x)
      graph.setNodeAttribute(id, "y", -placed.y)
    })
  } catch {
    circular.assign(graph, { scale: 120 })
  }
}

export const LIGHT_PALETTE: GraphPalette = {
  node: "#171717",
  owned: "#2563eb",
  highValue: "#d97706",
  edge: "#a3a3a3",
  ownedEdge: "#2563eb",
  composedEdge: "#d97706",
  dim: "#d4d4d4",
  label: "#0a0a0a",
  edgeLabel: "#404040",
  halo: "#ffffff",
  backdrop: "#ffffff",
  backdropShadow: "rgba(0, 0, 0, 0.16)",
  labelBg: "#f5f5f5",
}

export const DARK_PALETTE: GraphPalette = {
  node: "#e5e5e5",
  owned: "#3b82f6",
  highValue: "#fbbf24",
  edge: "#737373",
  ownedEdge: "#3b82f6",
  composedEdge: "#f59e0b",
  dim: "#404040",
  label: "#fafafa",
  edgeLabel: "#d4d4d4",
  halo: "#0a0a0a",
  backdrop: "#171717",
  backdropShadow: "rgba(0, 0, 0, 0.55)",
  labelBg: "#171717",
}
