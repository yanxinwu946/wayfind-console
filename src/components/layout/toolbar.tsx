"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { PAGE_TITLE } from "@/lib/labels"
import { useStore } from "@/lib/store"
import { dash, shortName } from "@/lib/format"

export function Toolbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname()
  const { active } = useStore()
  const title = PAGE_TITLE[pathname] ?? "Wayfind"

  return (
    <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="打开导航"
        onClick={onMenu}
      >
        <Menu />
      </Button>
      <h1 className="min-w-0 flex-1 truncate text-[18px] font-semibold">{title}</h1>
      <div className="hidden min-w-0 max-w-[220px] truncate text-right text-[12px] text-muted-foreground lg:block">
        {active ? `${active.name} · ${shortName(active.identity)}` : dash("")}
      </div>
      <ThemeToggle />
    </header>
  )
}
