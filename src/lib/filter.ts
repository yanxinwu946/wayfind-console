import type { AuditRun, FindingRow, FindingsQuery } from "@/lib/types"

export function applyFindingsQuery(run: AuditRun, query: FindingsQuery): FindingRow[] {
  const q = query.q.trim().toLowerCase()
  return run.findings.filter((item) => {
    if (query.severity !== "all" && item.severity !== query.severity) return false
    if (query.check !== "all" && item.check !== query.check) return false
    if (query.backend !== "all" && item.backend !== query.backend) return false
    if (!q) return true
    const blob = [
      item.id,
      item.title,
      item.asset,
      item.evidence,
      item.replay,
      item.check,
      item.backend,
      item.opsec,
      JSON.stringify(item.extra ?? {}),
    ]
      .join(" ")
      .toLowerCase()
    return blob.includes(q)
  })
}

export function uniqueValues(rows: FindingRow[], key: keyof FindingRow): string[] {
  return [...new Set(rows.map((row) => String(row[key] || "")).filter(Boolean))].sort()
}
