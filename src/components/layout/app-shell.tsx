"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarPanel } from "@/components/layout/sidebar"
import { Toolbar } from "@/components/layout/toolbar"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

function useDesktop() {
  const [desktop, setDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const apply = () => setDesktop(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])
  return desktop
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, collapsed, setCollapsed } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const desktop = useDesktop()

  if (!ready) {
    return (
      <div className="h-svh bg-background p-2">
        <div className="flex h-full min-h-0 gap-2">
          <Skeleton className="hidden w-[272px] rounded-[14px] lg:block" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-12 w-full" />
            <div className="p-6">
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-svh min-w-0 gap-2 overflow-hidden bg-background p-2">
      {desktop ? (
        <aside
          className={cn(
            "flex min-h-0 shrink-0 overflow-hidden rounded-[14px]",
            collapsed ? "w-16" : "w-[272px]"
          )}
        >
          <SidebarPanel
            collapsed={collapsed}
            onToggle={() => setCollapsed(!collapsed)}
            className="w-full rounded-[14px]"
          />
        </aside>
      ) : null}

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[288px] max-w-[288px] border-0 bg-transparent p-2 shadow-none sm:max-w-[288px]"
        >
          <SheetTitle className="sr-only">导航</SheetTitle>
          <SidebarPanel
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
            className="rounded-[14px]"
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Toolbar onMenu={() => setMobileOpen(true)} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 lg:px-6 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
