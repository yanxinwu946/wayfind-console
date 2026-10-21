"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const OPTIONS = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
] as const

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="切换主题" className="relative">
          <Sun
            className={`size-4 transition-transform duration-200 ${
              isDark ? "scale-0 rotate-90" : "scale-100 rotate-0"
            }`}
          />
          <Moon
            className={`absolute size-4 transition-transform duration-200 ${
              isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90"
            }`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          {OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <option.icon className="size-4" />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
