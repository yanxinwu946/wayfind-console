import type { AuditRun } from "@/lib/types"

export function exportRun(run: AuditRun) {
  const payload = {
    findings: run.findings.map(({ uid: _uid, ...rest }) => rest),
    identities: run.loot,
    run: run.run,
    name: run.name,
    domain: run.domain,
    dcHost: run.dcHost,
    identity: run.identity,
    profile: run.profile,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${run.name.replace(/\s+/g, "-")}-findings.json`
  a.click()
  URL.revokeObjectURL(url)
}
