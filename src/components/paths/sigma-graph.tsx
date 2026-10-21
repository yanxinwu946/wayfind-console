"use client"

import { useEffect, useMemo, type ReactNode } from "react"
import { Maximize2, Minus, Plus } from "lucide-react"
import {
  SigmaContainer,
  useCamera,
  useLoadGraph,
  useRegisterEvents,
  useSigma,
} from "@react-sigma/core"
import { layerBorder } from "@sigma/node-border"
import { MultiDirectedGraph } from "graphology"
import type { AbstractGraph, Attributes } from "graphology-types"
import { DEFAULT_STYLES } from "sigma"
import {
  extremityArrow,
  layerFill,
  pathLine,
  sdfCircle,
  sdfDiamond,
  sdfSquare,
  sdfTriangle,
} from "sigma/rendering"
import type { EdgeDisplayData, NodeDisplayData } from "sigma/types"
import "@react-sigma/core/lib/style.css"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { EdgeDocTarget } from "@/lib/bh-edge-docs"
import type { AclEdge } from "@/lib/graph"
import {
  applyPathLayout,
  buildPathGraph,
  type GraphLayoutKind,
  type GraphPalette,
  type GraphScope,
  type PathGraph,
} from "@/lib/path-graph"

type GraphFocusState = {
  hoveredNode?: string | null
  selectedNode?: string | null
  scope?: GraphScope
}

type SigmaPathGraphProps = {
  edges: AclEdge[]
  layout: GraphLayoutKind
  palette: GraphPalette
  selected: string | null
  scope: GraphScope
  onSelect: (nodeId: string | null) => void
  onOpenDocs: (target: EdgeDocTarget) => void
}

function LoadGraph({ graph }: { graph: PathGraph }) {
  const sigma = useSigma()
  const loadGraph = useLoadGraph()
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      loadGraph(graph)
      sigma.getCamera().reset({ duration: 0 })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [graph, loadGraph, sigma])
  return null
}

function GraphFocus({
  selected,
  scope,
}: {
  selected: string | null
  scope: GraphScope
}) {
  const sigma = useSigma()
  useEffect(() => {
    sigma.setGraphState({ selectedNode: selected, scope } as never)
  }, [scope, selected, sigma])
  return null
}

function GraphEvents({
  onSelect,
  onOpenDocs,
}: {
  onSelect: (nodeId: string | null) => void
  onOpenDocs: (target: EdgeDocTarget) => void
}) {
  const sigma = useSigma()
  const registerEvents = useRegisterEvents()

  useEffect(() => {
    let hovered: string | null = null
    let leaveTimer: number | null = null

    const setHovered = (node: string | null) => {
      if (hovered === node) return
      hovered = node
      sigma.setGraphState({ hoveredNode: node } as never)
    }

    const enter = (node: string) => {
      if (leaveTimer !== null) {
        window.clearTimeout(leaveTimer)
        leaveTimer = null
      }
      setHovered(node)
    }

    const leave = () => {
      if (leaveTimer !== null) window.clearTimeout(leaveTimer)
      leaveTimer = window.setTimeout(() => {
        leaveTimer = null
        setHovered(null)
      }, 120)
    }

    const openEdge = (edge: string) => {
      const graph = sigma.getGraph()
      const [source, target] = graph.extremities(edge)
      const rights = graph.getEdgeAttribute(edge, "rights") as string[] | undefined
      const label = String(graph.getEdgeAttribute(edge, "label") ?? "")
      const kinds = rights?.length ? rights : label.split(/\s*·\s*/).filter(Boolean)
      if (kinds.length === 0) return
      onSelect(source)
      onOpenDocs({
        kinds,
        src: String(graph.getNodeAttribute(source, "label") ?? source),
        dst: String(graph.getNodeAttribute(target, "label") ?? target),
      })
    }

    registerEvents({
      clickNode: ({ node }) => onSelect(node),
      clickEdge: ({ edge }) => openEdge(edge),
      clickEdgeLabel: ({ edge }) => openEdge(edge),
      clickStage: () => {
        if (leaveTimer !== null) {
          window.clearTimeout(leaveTimer)
          leaveTimer = null
        }
        setHovered(null)
        onSelect(null)
      },
      enterNode: ({ node }) => enter(node),
      leaveNode: () => leave(),
      enterNodeLabel: ({ node }) => enter(node),
      leaveNodeLabel: () => leave(),
    })

    return () => {
      if (leaveTimer !== null) window.clearTimeout(leaveTimer)
    }
  }, [onOpenDocs, onSelect, registerEvents, sigma])

  return null
}

function ZoomButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          className="rounded-none text-muted-foreground hover:text-foreground"
          onClick={onClick}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  )
}

function GraphZoomControls() {
  const { zoomIn, zoomOut, reset } = useCamera({ duration: 200, factor: 1.5 })
  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col overflow-hidden rounded-[10px] border border-border bg-card shadow-[0_1px_2px_rgba(10,10,10,0.04)] dark:shadow-none">
      <ZoomButton label="放大" onClick={() => zoomIn()}>
        <Plus />
      </ZoomButton>
      <ZoomButton label="缩小" onClick={() => zoomOut()}>
        <Minus />
      </ZoomButton>
      <Separator />
      <ZoomButton label="适应画布" onClick={() => reset()}>
        <Maximize2 />
      </ZoomButton>
    </div>
  )
}

export function SigmaPathGraph({
  edges,
  layout,
  palette,
  selected,
  scope,
  onSelect,
  onOpenDocs,
}: SigmaPathGraphProps) {
  const graph = useMemo(() => {
    const next = buildPathGraph(edges, palette)
    applyPathLayout(next, layout)
    return next
  }, [edges, layout, palette])

  const options = useMemo(
    () => ({
      customGraphState: {
        hoveredNode: null as string | null,
        selectedNode: null as string | null,
        scope: "reachable" as GraphScope,
      },
      primitives: {
        nodes: {
          shapes: [sdfCircle(), sdfDiamond(), sdfSquare(), sdfTriangle()],
          layers: [
            layerFill(),
            layerBorder({
              borders: [
                { size: 0.16, color: { attribute: "halo" } },
                { size: 0, color: { attribute: "color" }, fill: true },
              ],
            }),
          ],
          label: { margin: 12 },
        },
        edges: {
          paths: [pathLine()],
          extremities: [extremityArrow()],
          label: {
            textBorder: { width: 6, color: palette.labelBg },
          },
        },
      },
      styles: {
        nodes: {
          ...DEFAULT_STYLES.nodes,
          depth: "nodes" as const,
          labelDepth: "topNodes" as const,
          labelColor: palette.label,
          labelSize: 13,
          labelFont: "Geist, ui-sans-serif, system-ui, sans-serif",
          labelVisibility: "visible" as const,
          labelPosition: layout === "sequential" ? ("below" as const) : ("right" as const),
          labelBackgroundColor: palette.labelBg,
          labelBackgroundPadding: 4,
          cursor: "pointer",
          shape: { attribute: "shape", defaultValue: "circle" },
          halo: { attribute: "halo", defaultValue: palette.halo },
          backdropColor: palette.backdrop,
          backdropShadowColor: palette.backdropShadow,
        },
        edges: {
          ...DEFAULT_STYLES.edges,
          depth: "edges" as const,
          labelDepth: "topEdges" as const,
          head: "arrow" as const,
          labelColor: palette.edgeLabel,
          labelSize: 11,
          labelFont: "Geist, ui-sans-serif, system-ui, sans-serif",
          labelVisibility: "visible" as const,
          labelPosition: "above" as const,
          labelBackgroundColor: palette.labelBg,
          labelBackgroundPadding: 5,
          cursor: "pointer",
        },
      },
      settings: {
        allowInvalidContainer: true,
        renderEdgeLabels: true,
        itemSizesReference: "screen" as const,
        autoRescaleContent: "positions" as const,
        labelRenderedSizeThreshold: 0,
        labelDensity: 12,
        minCameraRatio: 0.15,
        maxCameraRatio: 3,
        stagePadding: 56,
        minEdgeThickness: 1.4,
        nodePickingPadding: 8,
        edgePickingPadding: 8,
        enableEdgeEvents: true,
        nodeLabelEvents: "extend" as const,
        edgeLabelEvents: "extend" as const,
      },
      nodeReducer: (
        key: string,
        computed: NodeDisplayData,
        attrs: Attributes,
        _state: unknown,
        graphState: GraphFocusState,
        graphInstance: AbstractGraph
      ) => {
        const focus = graphState.hoveredNode || graphState.selectedNode
        if (focus) {
          if (key === focus || graphInstance.areNeighbors(focus, key)) {
            return {
              ...computed,
              opacity: 1,
              depth: key === focus ? "topNodes" : computed.depth,
            }
          }
          return { ...computed, opacity: 0.16 }
        }
        if (graphState.scope !== "all" && attrs.reachable === false) {
          return { ...computed, opacity: 0.18 }
        }
        return computed
      },
      edgeReducer: (
        key: string,
        computed: EdgeDisplayData,
        attrs: Attributes,
        _state: unknown,
        graphState: GraphFocusState,
        graphInstance: AbstractGraph
      ) => {
        const focus = graphState.hoveredNode || graphState.selectedNode
        if (focus) {
          const [source, target] = graphInstance.extremities(key)
          if (source === focus || target === focus) {
            return { ...computed, opacity: 1, depth: "topEdges" }
          }
          return { ...computed, opacity: 0.08 }
        }
        if (graphState.scope !== "all" && attrs.reachable === false) {
          return { ...computed, opacity: 0.12 }
        }
        return computed
      },
    }),
    [layout, palette]
  )

  return (
    <SigmaContainer
      key={layout}
      graph={MultiDirectedGraph}
      options={options}
      className="relative overflow-hidden rounded-[10px] border border-border bg-muted/30 [&_.react-sigma]:h-full [&_.react-sigma]:w-full [&_.sigma-container]:h-full [&_.sigma-container]:w-full"
      style={{
        height: 560,
        width: "100%",
        background: "transparent",
      }}
    >
      <LoadGraph graph={graph} />
      <GraphFocus selected={selected} scope={scope} />
      <GraphEvents onSelect={onSelect} onOpenDocs={onOpenDocs} />
      <GraphZoomControls />
    </SigmaContainer>
  )
}
