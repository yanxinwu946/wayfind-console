export const SEVERITY_LABEL: Record<string, string> = {
  critical: "严重",
  high: "高",
  medium: "中",
  low: "低",
  info: "信息",
}

export const CHECK_LABEL: Record<string, string> = {
  bloodhound: "目录图",
  "password-policy": "口令策略",
  laps: "LAPS",
  roasting: "Kerberoast",
  "user-attrs": "用户属性",
  "privileged-groups": "特权组",
  outdated: "过期与基线",
  adidns: "AD DNS",
  ldap: "LDAP 防护",
  shares: "共享",
  adcs: "证书服务",
  gpp: "GPP",
  gmsa: "gMSA",
  clock: "时钟偏差",
  ntlm: "NTLM",
  delegation: "委派",
  dmsa: "dMSA",
  trusts: "信任",
  exchange: "Exchange",
  sccm: "SCCM",
  wsus: "WSUS",
  sql: "SQL",
  smb: "SMB",
  access: "访问",
  network: "网段",
  "dc-vulns": "DC 漏洞",
  azure: "Azure",
  description: "描述字段",
  shadow: "影子凭据",
  timeroast: "Timeroast",
  domain: "域",
  password: "口令",
}

export const BACKEND_LABEL: Record<string, string> = {
  bloodhound: "BloodHound",
  nxc: "NetExec",
  ldap: "LDAP",
  certipy: "Certipy",
  compose: "合成",
  ntp: "NTP",
}

export const OPSEC_LABEL: Record<string, string> = {
  "read-only LDAP": "只读 LDAP",
  "hit DC": "命中 DC",
  "request tickets": "申请票据",
}

export const PROFILE_LABEL: Record<string, string> = {
  recon: "侦察 · 匿名",
  audit: "审计 · 只读目录",
  offensive: "进攻 · 含票据",
}

export function labelOf(
  map: Record<string, string>,
  value: string | null | undefined
): string {
  if (!value) return "—"
  return map[value] ?? value
}

export function findingKind(id: string): string {
  if (id.startsWith("acl.")) return "ACL"
  if (id.startsWith("hop.")) return "路径"
  if (id.startsWith("roast.")) return "烤肉"
  if (id.startsWith("adcs.")) return "证书"
  if (id.startsWith("gpp.")) return "GPP"
  if (id.startsWith("shares.")) return "共享"
  if (id.startsWith("gmsa.")) return "gMSA"
  if (id.startsWith("ldap.")) return "LDAP"
  return "基线"
}

export const PAGE_TITLE: Record<string, string> = {
  "/": "概览",
  "/findings": "发现",
  "/paths": "攻击路径",
  "/loot": "凭据",
  "/runs": "运行记录",
}
