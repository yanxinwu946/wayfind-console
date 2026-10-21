export type Severity = "critical" | "high" | "medium" | "low" | "info"

export type Finding = {
  id: string
  severity: Severity | string
  title: string
  asset: string
  evidence: string
  replay: string
  backend: string
  check: string
  opsec: string
  extra?: Record<string, unknown>
}

export type FindingRow = Finding & { uid: string }

export type LootIdentity = {
  username: string
  password?: string | null
  hashes?: string | null
  source?: string
  extra?: Record<string, unknown>
}

export type RunMeta = {
  schema?: string
  version?: string
  profile?: string
  identity?: string
  domain?: string
  dc?: string
  dc_host?: string
  ldaps?: boolean
  dns?: string
  kerberos?: boolean
  checks?: string[]
  clock_offset?: number | null
  kerberos_blocked?: boolean
  kerberos_block_reason?: string
  findings?: number
  loot?: number
}

export type AuditRun = {
  id: string
  name: string
  domain: string
  dcHost: string
  identity: string
  profile: string
  importedAt: string
  sourceLabel: string
  /** Old bundled samples used this; loadState drops them. */
  sample?: boolean
  findings: FindingRow[]
  loot: LootIdentity[]
  run?: RunMeta
}

export type ImportPayload = {
  findings?: Finding[]
  identities?: LootIdentity[]
  loot?: LootIdentity[] | { identities?: LootIdentity[] }
  run?: RunMeta
  name?: string
  domain?: string
  dcHost?: string
  identity?: string
  profile?: string
}

export type FindingsQuery = {
  q: string
  severity: string
  check: string
  backend: string
}

export const EMPTY_QUERY: FindingsQuery = {
  q: "",
  severity: "all",
  check: "all",
  backend: "all",
}
