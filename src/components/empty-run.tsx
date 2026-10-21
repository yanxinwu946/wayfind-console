"use client"

import Link from "next/link"
import { FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function EmptyRun() {
  return (
    <Empty className="min-h-[360px] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderOpen />
        </EmptyMedia>
        <EmptyTitle>尚未载入运行</EmptyTitle>
        <EmptyDescription>
          导入 wayfind 的 findings.json。
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/runs">打开运行记录</Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
