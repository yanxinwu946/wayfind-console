import {
  Compass,
  FolderOpen,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  List,
} from "lucide-react"

export const NAV_ITEMS = [
  { href: "/", label: "概览", icon: LayoutDashboard },
  { href: "/findings", label: "发现", icon: List },
  { href: "/paths", label: "攻击路径", icon: GitBranch },
  { href: "/loot", label: "凭据", icon: KeyRound },
  { href: "/runs", label: "运行记录", icon: FolderOpen },
] as const

export { Compass }
