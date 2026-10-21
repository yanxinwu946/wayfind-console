"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronsLeft, ChevronsRight, Download, FolderOpen, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Compass, NAV_ITEMS } from "@/components/layout/nav-items"
import { exportRun } from "@/lib/export-run"
import { formatNumber, initials, shortName } from "@/lib/format"
import { PROFILE_LABEL } from "@/lib/labels"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1" aria-label="主导航">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const link = (
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-8 items-center gap-2 rounded-[10px] px-2 text-[13px] transition-colors duration-150",
              collapsed ? "justify-center" : "",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
          </Link>
        )
        if (!collapsed) return <div key={item.href}>{link}</div>
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}

export function AccountCard({ collapsed }: { collapsed: boolean }) {
  const { active, runs, clearRuns } = useStore()
  const router = useRouter()
  const name = active ? shortName(active.identity) : "未选择运行"
  const domain = active?.domain || "—"
  const profile = active ? PROFILE_LABEL[active.profile] ?? active.profile : "—"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="账号菜单"
          className={cn(
            "flex w-full min-w-0 items-center gap-2 rounded-[10px] border border-sidebar-border bg-card p-2 text-left transition-colors hover:bg-sidebar-accent",
            collapsed && "justify-center border-0 bg-transparent p-1"
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold tracking-wide">
            {initials(active?.identity || "WF")}
          </span>
          {collapsed ? (
            <span className="sr-only">{name}</span>
          ) : (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{domain}</span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={collapsed ? "right" : "top"}
        align="start"
        sideOffset={8}
        className="w-64"
      >
        <DropdownMenuLabel>操作员</DropdownMenuLabel>
        <div className="px-1.5 pb-1 text-[12px] text-muted-foreground">
          {active ? `${name} · ${profile}` : "尚未载入运行"}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/runs")}>
          <FolderOpen />
          管理运行
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!active} onClick={() => active && exportRun(active)}>
          <Download />
          导出当前 findings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={runs.length === 0}
          onClick={() => {
            clearRuns()
            router.push("/runs")
          }}
        >
          <LogOut />
          清空本机运行
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SidebarPanel({
  collapsed,
  onToggle,
  onNavigate,
  className,
}: {
  collapsed: boolean
  onToggle?: () => void
  onNavigate?: () => void
  className?: string
}) {
  const { active } = useStore()
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[0_1px_2px_rgba(10,10,10,0.04)] dark:shadow-none",
        className
      )}
    >
      {collapsed ? (
        <div className="flex flex-col items-center gap-1 py-2">
          <Compass className="size-4 shrink-0" aria-hidden />
          <span className="sr-only">Wayfind</span>
          {onToggle ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="展开侧栏"
              onClick={onToggle}
            >
              <ChevronsRight />
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex h-12 items-center gap-2 px-3">
          <Compass className="size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">Wayfind</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {active ? `${formatNumber(active.findings.length)} 条发现` : "枚举控制台"}
            </div>
          </div>
          {onToggle ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="折叠侧栏"
              onClick={onToggle}
              className="ml-auto"
            >
              <ChevronsLeft />
            </Button>
          ) : null}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
      </div>
      <div className="p-2">
        <AccountCard collapsed={collapsed} />
      </div>
    </div>
  )
}
