"use client"

import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { StoreProvider } from "@/lib/store"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="wayfind-theme"
      disableTransitionOnChange={false}
    >
      <TooltipProvider delayDuration={200}>
        <StoreProvider>
          {children}
          <Toaster position="bottom-right" />
        </StoreProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
