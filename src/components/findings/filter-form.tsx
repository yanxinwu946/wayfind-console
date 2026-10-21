"use client"

import { Field, FieldRow, FormActions } from "@/components/field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BACKEND_LABEL, CHECK_LABEL, SEVERITY_LABEL, labelOf } from "@/lib/labels"
import { queryEqual } from "@/lib/format"
import type { FindingsQuery } from "@/lib/types"

export function FilterForm({
  draft,
  applied,
  options,
  onChange,
  onSubmit,
  onReset,
}: {
  draft: FindingsQuery
  applied: FindingsQuery
  options: { checks: string[]; backends: string[] }
  onChange: (next: FindingsQuery) => void
  onSubmit: () => void
  onReset: () => void
}) {
  const stale = !queryEqual(draft, applied)

  function set<K extends keyof FindingsQuery>(key: K, value: FindingsQuery[K]) {
    onChange({ ...draft, [key]: value })
  }

  return (
    <form
      className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(10,10,10,0.04)] dark:shadow-none"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <h2 className="text-[14px] font-semibold">检索条件</h2>
      <p className="mt-1 text-[12px] text-muted-foreground">
        改变条件后需提交，结果区仍对应上次检索。
      </p>
      <div className="mt-4 space-y-1">
        <FieldRow>
          <Field id="q" label="关键词" hint="匹配标题、对象、证据与复现命令">
            <Input
              id="q"
              name="q"
              value={draft.q}
              placeholder="AddMember、ESC16、C$"
              onChange={(event) => set("q", event.target.value)}
            />
          </Field>
          <Field id="severity" label="优先级" hint="按 findings.severity 过滤">
            <Select value={draft.severity} onValueChange={(value) => set("severity", value)}>
              <SelectTrigger id="severity" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">全部</SelectItem>
                {Object.entries(SEVERITY_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="check" label="检查类型" hint="对应 findings.check">
            <Select value={draft.check} onValueChange={(value) => set("check", value)}>
              <SelectTrigger id="check" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">全部</SelectItem>
                {options.checks.map((value) => (
                  <SelectItem key={value} value={value}>
                    {labelOf(CHECK_LABEL, value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="backend" label="数据来源" hint="bloodhound / nxc / ldap / certipy">
            <Select value={draft.backend} onValueChange={(value) => set("backend", value)}>
              <SelectTrigger id="backend" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">全部</SelectItem>
                {options.backends.map((value) => (
                  <SelectItem key={value} value={value}>
                    {labelOf(BACKEND_LABEL, value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldRow>
      </div>
      {stale ? (
        <Alert className="mt-3">
          <AlertTitle>结果尚未更新</AlertTitle>
          <AlertDescription>
            当前表格仍对应上次提交的条件。提交检索后才会刷新。
          </AlertDescription>
        </Alert>
      ) : null}
      <FormActions>
        <Button type="button" variant="outline" onClick={onReset}>
          重置
        </Button>
        <Button type="submit">检索</Button>
      </FormActions>
    </form>
  )
}
