"use client"

import { useEffect, useRef, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

export function SeverityChart({
  data,
}: {
  data: { name: string; value: number }[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="h-[220px] w-full min-w-0">
      {size.width < 8 ? (
        <Skeleton className="h-full w-full rounded-[10px]" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={28} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={28}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="value"
              fill="var(--chart-1)"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
