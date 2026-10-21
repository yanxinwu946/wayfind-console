<div align="center">

# Wayfind Console

**扫完的域，摊开看。**

[CLI](https://github.com/yanxinwu946/wayfind)
·
[控制台](https://github.com/yanxinwu946/wayfind-console)
·
[在线](https://wayfind.569888.xyz)

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![wayfind](https://img.shields.io/badge/pairs_with-wayfind_CLI-0A0A0A?style=flat-square)](https://github.com/yanxinwu946/wayfind)

</div>

[Wayfind](https://github.com/yanxinwu946/wayfind) 对着域控扫一遍，写出 `findings.json`。这份控制台把同一份结果变成概览、攻击路径、发现和凭据。

在线直接打开：[wayfind.569888.xyz](https://wayfind.569888.xyz)

## 和 CLI 怎么配合

```bash
# 1. 扫
wayfind -d corp.local -dc <DC> -u analyst -p '...' --ldaps

# 2. 打开控制台，导入 findings.json。也可以先载入样例。
```

只导入 `findings.json`。路径图画当前身份的下一跳，点边上的权限能看 BloodHound 官方说明。

## 本地跑

```bash
pnpm install
pnpm dev
```

浏览器打开开发地址，拖入扫描结果即可。运行记录存在本机，不会上传。
