"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { AuditRun, FindingsQuery } from "@/lib/types"
import { EMPTY_QUERY } from "@/lib/types"

const STORAGE_KEY = "wayfind-console:v1"
const SIDEBAR_KEY = "wayfind-sidebar-collapsed"

type StoreContextValue = {
  ready: boolean
  runs: AuditRun[]
  active: AuditRun | null
  collapsed: boolean
  setCollapsed: (value: boolean) => void
  setActive: (id: string) => void
  addRun: (run: AuditRun, activate?: boolean) => void
  removeRun: (id: string) => void
  renameRun: (id: string, name: string) => void
  clearRuns: () => void
  query: FindingsQuery
  draft: FindingsQuery
  setDraft: (query: FindingsQuery) => void
  applyQuery: () => void
  resetQuery: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

function persist(runs: AuditRun[], activeId: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ runs, activeId }))
}

function isStoredRun(run: AuditRun): boolean {
  return Boolean(
    run &&
      typeof run.id === "string" &&
      Array.isArray(run.findings) &&
      Array.isArray(run.loot) &&
      !run.sample
  )
}

function loadState(): { runs: AuditRun[]; activeId: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { runs: [], activeId: "" }
    const parsed = JSON.parse(raw) as { runs?: AuditRun[]; activeId?: string }
    const runs = Array.isArray(parsed.runs) ? parsed.runs.filter(isStoredRun) : []
    if (runs.length === 0) return { runs: [], activeId: "" }
    const activeId = runs.some((run) => run.id === parsed.activeId)
      ? parsed.activeId!
      : runs[0].id
    return { runs, activeId }
  } catch {
    return { runs: [], activeId: "" }
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [runs, setRuns] = useState<AuditRun[]>([])
  const [activeId, setActiveId] = useState("")
  const [collapsed, setCollapsedState] = useState(false)
  const [query, setQuery] = useState<FindingsQuery>(EMPTY_QUERY)
  const [draft, setDraft] = useState<FindingsQuery>(EMPTY_QUERY)

  useEffect(() => {
    const state = loadState()
    setRuns(state.runs)
    setActiveId(state.activeId)
    setCollapsedState(localStorage.getItem(SIDEBAR_KEY) === "1")
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    persist(runs, activeId)
  }, [ready, runs, activeId])

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value)
    localStorage.setItem(SIDEBAR_KEY, value ? "1" : "0")
  }, [])

  const setActive = useCallback((id: string) => {
    setActiveId(id)
    setQuery(EMPTY_QUERY)
    setDraft(EMPTY_QUERY)
    setRuns((prev) => {
      persist(prev, id)
      return prev
    })
  }, [])

  const addRun = useCallback((run: AuditRun, activate = true) => {
    setRuns((prev) => [run, ...prev.filter((item) => item.id !== run.id)])
    if (activate) {
      setActiveId(run.id)
      setQuery(EMPTY_QUERY)
      setDraft(EMPTY_QUERY)
    }
  }, [])

  const removeRun = useCallback((id: string) => {
    setRuns((prev) => {
      const next = prev.filter((item) => item.id !== id)
      setActiveId((current) => (current !== id ? current : next[0]?.id ?? ""))
      return next
    })
  }, [])

  const renameRun = useCallback((id: string, name: string) => {
    setRuns((prev) => prev.map((item) => (item.id === id ? { ...item, name } : item)))
  }, [])

  const clearRuns = useCallback(() => {
    setRuns([])
    setActiveId("")
  }, [])

  const applyQuery = useCallback(() => setQuery(draft), [draft])
  const resetQuery = useCallback(() => {
    setDraft(EMPTY_QUERY)
    setQuery(EMPTY_QUERY)
  }, [])

  const active = useMemo(
    () => runs.find((run) => run.id === activeId) ?? null,
    [runs, activeId]
  )

  const value = useMemo(
    () => ({
      ready,
      runs,
      active,
      collapsed,
      setCollapsed,
      setActive,
      addRun,
      removeRun,
      renameRun,
      clearRuns,
      query,
      draft,
      setDraft,
      applyQuery,
      resetQuery,
    }),
    [
      ready,
      runs,
      active,
      collapsed,
      setCollapsed,
      setActive,
      addRun,
      removeRun,
      renameRun,
      clearRuns,
      query,
      draft,
      applyQuery,
      resetQuery,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
