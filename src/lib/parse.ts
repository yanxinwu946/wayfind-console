import type {
  AuditRun,
  Finding,
  FindingRow,
  ImportPayload,
  LootIdentity,
  RunMeta,
  Severity,
} from "@/lib/types"

const SEVERITIES = new Set(["critical", "high", "medium", "low", "info"])

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value)
}

function normalizeSeverity(value: string): Severity | string {
  const lower = value.toLowerCase()
  return SEVERITIES.has(lower) ? lower : value || "info"
}

function parseFinding(row: unknown, index: number, prefix: string): FindingRow | null {
  const rec = asRecord(row)
  if (!rec) return null
  const id = asString(rec.id).trim()
  if (!id) return null
  const extraRec = asRecord(rec.extra) ?? {}
  return {
    uid: `${prefix}-${index}-${id}`,
    id,
    severity: normalizeSeverity(asString(rec.severity) || "info"),
    title: asString(rec.title) || id,
    asset: asString(rec.asset),
    evidence: asString(rec.evidence),
    replay: asString(rec.replay),
    backend: asString(rec.backend),
    check: asString(rec.check),
    opsec: asString(rec.opsec),
    extra: extraRec,
  }
}

function parseLoot(row: unknown): LootIdentity | null {
  const rec = asRecord(row)
  if (!rec) return null
  const username = asString(rec.username).trim()
  if (!username) return null
  return {
    username,
    password: rec.password == null ? null : asString(rec.password),
    hashes: rec.hashes == null ? null : asString(rec.hashes),
    source: asString(rec.source),
    extra: asRecord(rec.extra) ?? {},
  }
}

function lootFromFindings(findings: Finding[]): LootIdentity[] {
  const seen = new Map<string, LootIdentity>()
  for (const finding of findings) {
    const extra = finding.extra ?? {}
    if (finding.id === "gpp.cpassword" && extra.password) {
      const username = finding.asset || asString(extra.user)
      if (!username) continue
      seen.set(username.toLowerCase(), {
        username,
        password: asString(extra.password),
        source: "gpp",
        extra: { path: finding.evidence },
      })
    }
  }
  return [...seen.values()]
}

function inferDomain(findings: Finding[]): string {
  for (const finding of findings) {
    const blob = `${finding.title} ${finding.asset} ${asString(finding.extra?.src)} ${asString(finding.extra?.dst)}`
    const match = blob.match(/@([A-Z0-9.-]+\.[A-Z0-9.-]+)/i)
    if (match) return match[1].toLowerCase()
  }
  return ""
}

function inferIdentity(findings: Finding[], loot: LootIdentity[]): string {
  const owned = findings.find(
    (item) => item.id === "hop.owned-acl" || item.id === "hop.owned-group",
  )
  if (owned?.extra?.src) return asString(owned.extra.src)
  if (loot[0]?.username) return loot[0].username
  const member = findings.find((item) => item.id === "acl.MemberOf")
  if (member?.extra?.src) return asString(member.extra.src)
  const gpp = findings.find((item) => item.id === "gpp.cpassword")
  if (gpp?.asset) return gpp.asset
  return ""
}

function inferDc(findings: Finding[]): string {
  for (const finding of findings) {
    const replay = finding.replay
    const ip = replay.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/)
    if (ip) return ip[1]
    const host = replay.match(/\b([A-Za-z0-9-]+\.[A-Za-z0-9.-]+)\b/)
    if (host && !host[1].includes(" ")) return host[1]
  }
  return ""
}

export type ParseResult = {
  findings: FindingRow[]
  loot: LootIdentity[]
  run?: RunMeta
  skipped: number
  domain: string
  identity: string
  dcHost: string
  profile: string
}

export function parseWayfindJson(raw: string, sourceName: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error(`${sourceName} 不是合法 JSON`)
  }

  const rec = asRecord(data)
  const list = Array.isArray(data)
    ? data
    : rec && Array.isArray(rec.findings)
      ? rec.findings
      : null

  if (!list) {
    throw new Error(`${sourceName} 缺少 findings 数组`)
  }

  const prefix = sourceName.replace(/\W+/g, "").slice(0, 12) || "run"
  const findings: FindingRow[] = []
  let skipped = 0
  list.forEach((row, index) => {
    const parsed = parseFinding(row, index, prefix)
    if (parsed) findings.push(parsed)
    else skipped += 1
  })

  const lootRows: unknown[] = rec
    ? Array.isArray(rec.identities)
      ? rec.identities
      : Array.isArray(rec.loot)
        ? rec.loot
        : asRecord(rec.loot)?.identities && Array.isArray(asRecord(rec.loot)!.identities)
          ? (asRecord(rec.loot)!.identities as unknown[])
          : []
    : []

  const loot = [
    ...lootRows.map(parseLoot).filter((item): item is LootIdentity => Boolean(item)),
    ...lootFromFindings(findings),
  ].filter(
    (item, index, arr) =>
      arr.findIndex((other) => other.username.toLowerCase() === item.username.toLowerCase()) ===
      index
  )

  const run = rec && asRecord(rec.run) ? (rec.run as RunMeta) : rec ? (rec as ImportPayload).run : undefined

  return {
    findings,
    loot,
    run,
    skipped,
    domain: asString(run?.domain) || inferDomain(findings),
    identity: asString(run?.identity) || inferIdentity(findings, loot),
    dcHost: asString(run?.dc_host) || asString(run?.dc) || inferDc(findings),
    profile: asString(run?.profile) || "audit",
  }
}

function identitiesFromUnknown(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  const rec = asRecord(data)
  if (!rec) return []
  if (Array.isArray(rec.identities)) return rec.identities
  if (Array.isArray(rec.loot)) return rec.loot
  const nested = asRecord(rec.loot)
  if (nested && Array.isArray(nested.identities)) return nested.identities
  return []
}

function runMetaFromUnknown(data: unknown): RunMeta | undefined {
  const rec = asRecord(data)
  if (!rec) return undefined
  const nested = asRecord(rec.run)
  return (nested ?? rec) as RunMeta
}

function dedupeLoot(items: LootIdentity[]): LootIdentity[] {
  return items.filter(
    (item, index, arr) =>
      arr.findIndex((other) => other.username.toLowerCase() === item.username.toLowerCase()) ===
      index
  )
}

function classifyImportText(name: string, text: string): "findings" | "loot" | "run" {
  try {
    const data = JSON.parse(text) as unknown
    if (Array.isArray(data)) return "findings"
    const rec = asRecord(data)
    if (rec && Array.isArray(rec.findings)) return "findings"
    if (rec && identitiesFromUnknown(rec).length > 0) return "loot"
    if (
      rec &&
      (rec.profile ||
        rec.clock_offset !== undefined ||
        rec.kerberos_blocked !== undefined ||
        rec.kerberos_block_reason)
    ) {
      return "run"
    }
  } catch {
    /* fall through to filename */
  }
  const lower = name.toLowerCase()
  if (lower.includes("loot")) return "loot"
  if (lower.includes("run.json") || lower.endsWith("run.json")) return "run"
  return "findings"
}

export function mergeImportParts(parts: { name: string; text: string }[]): ParseResult {
  if (parts.length === 0) {
    throw new Error("请选择 findings.json")
  }

  let findingsPart: { name: string; text: string } | undefined
  let lootPart: { name: string; text: string } | undefined
  let runPart: { name: string; text: string } | undefined

  for (const part of parts) {
    const kind = classifyImportText(part.name, part.text)
    if (kind === "loot") lootPart = part
    else if (kind === "run") runPart = part
    else findingsPart = part
  }

  if (!findingsPart) {
    throw new Error("请选择 findings.json")
  }

  const parsed = parseWayfindJson(findingsPart.text, findingsPart.name)

  if (lootPart) {
    let data: unknown
    try {
      data = JSON.parse(lootPart.text)
    } catch {
      throw new Error(`${lootPart.name} 不是合法 JSON`)
    }
    const extra = identitiesFromUnknown(data)
      .map(parseLoot)
      .filter((item): item is LootIdentity => Boolean(item))
    parsed.loot = dedupeLoot([...extra, ...parsed.loot])
  }

  if (runPart) {
    let data: unknown
    try {
      data = JSON.parse(runPart.text)
    } catch {
      throw new Error(`${runPart.name} 不是合法 JSON`)
    }
    const meta = runMetaFromUnknown(data)
    if (meta) {
      parsed.run = { ...(parsed.run ?? {}), ...meta }
      parsed.profile = asString(parsed.run.profile) || parsed.profile
    }
  }

  if (parsed.findings.length === 0) {
    throw new Error("没有有效 findings 条目")
  }
  return parsed
}

export async function parseImportFiles(files: File[]): Promise<ParseResult> {
  const parts = await Promise.all(
    files.map(async (file) => ({ name: file.name, text: await file.text() }))
  )
  return mergeImportParts(parts)
}

export function toAuditRun(
  parsed: ParseResult,
  opts: {
    name: string
    sourceLabel?: string
    importedAt?: string
    id?: string
    dcHost?: string
    identity?: string
    domain?: string
    profile?: string
  }
): AuditRun {
  return {
    id: opts.id ?? crypto.randomUUID(),
    name: opts.name,
    domain: opts.domain || parsed.domain,
    dcHost: opts.dcHost || parsed.dcHost,
    identity: opts.identity || parsed.identity,
    profile: opts.profile || parsed.profile,
    importedAt: opts.importedAt ?? new Date().toISOString(),
    sourceLabel: opts.sourceLabel ?? "导入",
    findings: parsed.findings,
    loot: parsed.loot,
    run: parsed.run,
  }
}
