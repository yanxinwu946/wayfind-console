"use client"

import { useRef, useState } from "react"
import { FileUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function asJsonFiles(list: FileList | File[] | null): File[] {
  if (!list) return []
  return Array.from(list).filter(
    (file) => file.name.toLowerCase().endsWith(".json") || file.type.includes("json")
  )
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FilePicker({
  id,
  name,
  accept,
  multiple,
  files = [],
  invalid,
  onFiles,
}: {
  id: string
  name: string
  accept?: string
  multiple?: boolean
  files?: File[]
  invalid?: boolean
  onFiles?: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const selected = files[0]

  function apply(list: FileList | File[] | null) {
    const next = asJsonFiles(list)
    onFiles?.(multiple ? next : next.slice(0, 1))
    if (inputRef.current && next.length === 0) inputRef.current.value = ""
  }

  function clear() {
    onFiles?.([])
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setDrag(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDrag(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDrag(false)
        apply(event.dataTransfer.files)
      }}
      className={cn(
        "rounded-[10px] border transition-colors has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
        selected && !drag ? "border-solid" : "border-dashed",
        drag && "border-foreground bg-muted/50",
        invalid && "border-destructive",
        !drag && !invalid && "border-input hover:bg-muted/40"
      )}
    >
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => apply(event.target.files)}
      />
      {selected ? (
        <div className="flex h-12 min-w-0 items-center gap-2 px-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <FileUp className="size-4 text-muted-foreground" />
          </span>
          <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer truncate text-[13px]">
            {selected.name}
            <span className="ml-2 text-[12px] text-muted-foreground">{fileSize(selected.size)}</span>
          </label>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="移除文件"
            onClick={clear}
          >
            <X />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex min-h-14 cursor-pointer items-center justify-center gap-2 px-4 py-2"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <FileUp className="size-4 text-muted-foreground" />
          </span>
          <span className="text-[13px] font-medium">拖放 findings.json</span>
          <span className="text-[12px] text-muted-foreground">或点击选择</span>
        </label>
      )}
    </div>
  )
}
