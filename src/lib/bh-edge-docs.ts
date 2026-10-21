export type EdgeDocTarget = {
  kinds: string[]
  src?: string
  dst?: string
}

export type BhEdgeDoc = {
  kind: string
  slug: string
  title: string
  markdown: string
  url: string
}

const DOCS_ORIGIN = "https://bloodhound.specterops.io"
const cache = new Map<string, BhEdgeDoc>()

export function splitEdgeRights(value: string): string[] {
  return value
    .split(/\s*·\s*|\s*,\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function bloodhoundEdgeSlug(kind: string): string {
  const raw = kind.trim()
  if (!raw) return ""
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw)) return raw
  const esc = raw.match(/^ADCSESC(.*)$/i)
  if (esc) return `adcs-esc${esc[1].toLowerCase()}`
  return raw
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
}

export function bloodhoundEdgeUrl(kind: string): string {
  return `${DOCS_ORIGIN}/resources/edges/${bloodhoundEdgeSlug(kind)}`
}

function normalizeNewlines(raw: string): string {
  return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

export function parseBloodhoundTitle(raw: string, fallback: string): string {
  const text = normalizeNewlines(raw)
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)
  if (frontmatter) {
    const titled = frontmatter[1].match(/^title:\s*["']?(.+?)["']?\s*$/m)
    if (titled?.[1]) return titled[1].trim()
  }
  const heading = text.match(/^#\s+(.+)$/m)
  return heading?.[1]?.trim() || fallback
}

export function mdxToMarkdown(raw: string): string {
  let text = normalizeNewlines(raw)
  text = text.replace(/^> ## Documentation Index[\s\S]*?(?=\n# )/m, "")
  const title = parseBloodhoundTitle(text, "")
  text = text.replace(/^---\n[\s\S]*?\n---\s*/, "")
  text = text.replace(/^import\s+.+;?\s*$/gm, "")
  text = text.replace(/<[A-Z][\w.]*\s*\/>/g, "")
  text = text.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
  text = text.replace(/^!\[Applies to[^\]]*]\([^)]+\)\s*$/gm, "")
  text = text.replace(/\[\]\(#heading-\d+\)/g, "")
  text = text.replace(/```(\w+)\s+theme=\{null\}/g, "```$1")
  text = text.replace(
    /]\((\/(?:resources|opengraph)[^)]*)\)/g,
    `](${DOCS_ORIGIN}$1)`
  )
  text = text.replace(
    /\[([^\]]*)\]\(https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]+)[^)]*\)/g,
    "[YouTube](https://www.youtube.com/watch?v=$2)"
  )
  text = text.replace(/\n{3,}/g, "\n\n").trim()
  if (title && !/^#\s/m.test(text)) text = `# ${title}\n\n${text}`
  return text
}

export async function fetchBloodhoundEdgeDoc(
  kind: string,
  signal?: AbortSignal
): Promise<BhEdgeDoc> {
  const slug = bloodhoundEdgeSlug(kind)
  if (!slug) throw new Error("empty-kind")
  const hit = cache.get(slug)
  if (hit) return hit
  const doc = await loadDoc(kind, slug, signal)
  cache.set(slug, doc)
  return doc
}

async function loadDoc(
  kind: string,
  slug: string,
  signal?: AbortSignal
): Promise<BhEdgeDoc> {
  const response = await fetch(`/api/bh-edge/${encodeURIComponent(slug)}`, {
    signal,
    cache: "no-store",
  })
  if (!response.ok) {
    const error = new Error(
      response.status === 404 ? "not-found" : "fetch-failed"
    )
    throw error
  }
  const body = (await response.json()) as BhEdgeDoc
  return {
    ...body,
    kind: body.kind || kind,
    slug: body.slug || slug,
    url: body.url || bloodhoundEdgeUrl(kind),
  }
}
