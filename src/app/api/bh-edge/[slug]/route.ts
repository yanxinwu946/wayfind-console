import { NextResponse } from "next/server"
import {
  bloodhoundEdgeUrl,
  mdxToMarkdown,
  parseBloodhoundTitle,
} from "@/lib/bh-edge-docs"

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const JSDELIVR =
  "https://cdn.jsdelivr.net/gh/SpecterOps/bloodhound-docs@main/docs/resources/edges"

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  if (!SLUG.test(slug)) {
    return NextResponse.json({ error: "bad-slug" }, { status: 400 })
  }

  const sources = [
    `${JSDELIVR}/${slug}.mdx`,
    `https://bloodhound.specterops.io/resources/edges/${slug}.md`,
  ]

  for (const source of sources) {
    try {
      const response = await fetch(source, {
        next: { revalidate: 86_400 },
        headers: { Accept: "text/plain, text/markdown, */*" },
      })
      if (!response.ok) continue
      const raw = await response.text()
      if (!raw.trim() || raw.includes("The requested page could not be found")) {
        continue
      }
      return NextResponse.json(
        {
          kind: parseBloodhoundTitle(raw, slug),
          slug,
          title: parseBloodhoundTitle(raw, slug),
          markdown: mdxToMarkdown(raw),
          url: bloodhoundEdgeUrl(slug),
        },
        {
          headers: {
            "Cache-Control": "private, no-cache",
          },
        }
      )
    } catch {
      continue
    }
  }

  return NextResponse.json(
    { error: "not-found", slug, url: bloodhoundEdgeUrl(slug) },
    { status: 404 }
  )
}
