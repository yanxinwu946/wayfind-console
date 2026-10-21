export function dash(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "string" && value.trim() === "") return "—"
  return String(value)
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return value.toLocaleString("zh-CN")
}

export function formatBeijing(iso?: string | null): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""
  return `${pick("year")}-${pick("month")}-${pick("day")} ${pick("hour")}:${pick("minute")}:${pick("second")}`
}

export function initials(name: string): string {
  const clean = name.replace(/@.*$/, "").replace(/[^A-Za-z0-9]+/g, "")
  if (!clean) return "WF"
  return clean.slice(0, 2).toUpperCase()
}

export function shortName(value: string): string {
  if (!value) return "—"
  return value.replace(/@[^@]+$/i, "")
}

export function queryEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
