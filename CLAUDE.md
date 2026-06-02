# AI 对话导购助手 · 设计方案生成工作流

## 项目说明

本项目用于快速生成 JD AI 购物助手的回复设计方案。设计师描述场景，agent 把场景翻译成**内容 schema**，再由**确定性渲染器**渲染成 Relay 组件实例。

> **架构原则（v4）**：
> 1. **布局不由 LLM 手写**。LLM 只产出内容 schema；布局由冻结的渲染器 + 设计师维护的组件库确定性还原。
> 2. **权威源分层防漂移**：组件（清单/ID/属性）的权威源在 **Relay**，实时读取，**不抄进 MD**；「怎么拼」的知识沉淀在本地 MD + 渲染器；维护成本只跟「新拼装范式」走，不跟组件数量走。

---

## 设计规范

- 📋 **内容 Schema（LLM 产出契约，必读）** → [design/content-schema.md](design/content-schema.md)
- 🧩 **拼装规范（区块词表 / 间距模型 / 范式参考板 / 约定）** → [design/assembly-spec.md](design/assembly-spec.md)
- ⚙️ **确定性渲染器（冻结代码，token 实时解析组件）** → [render/render-scheme.js](render/render-scheme.js)
- 📐 **视觉规范 / token / 字段 spec** → [design/ai-reply-design.md](design/ai-reply-design.md)
- 🛠 **Relay 手写实现手册（已降级为渲染器内部参考 / 兜底）** → [design/relay-api.md](design/relay-api.md)

> 本文件**不再维护规范副本**，组件清单也**不落 MD**（权威源在 Relay）。

---

## 快速开始

用户说「生成一个 XX 场景的方案」时：

1. 确认目标 Relay 节点链接（用户提供，或沿用上次链接）
2. 翻 [content-schema.md](design/content-schema.md) 把场景写成一份 `scheme.json`（**LLM 只做这一步的内容产出**）
3. （可选）把 schema 给设计师过目/微调
4. **读 [render/render-scheme.js](render/render-scheme.js) 全文**，原样拼到 `use_design_script` 脚本头部，末尾 `return await renderScheme(<本次schema>)`
5. 检查 return 的 `selfCheck` 全绿、`warnings` 为空，再调 `get_screenshot` 截图确认

> ⚠ **硬规则 1**：生成方案**必须先读 render-scheme.js 全文再用**，**禁止凭记忆手写/重建渲染逻辑**（会与文件漂移、丢掉已修的 bug）。
> ⚠ **硬规则 2**：不要手写 `createAutoLayout`/节点骨架——布局全部走渲染器。
> 渲染器按组件名 token 实时解析组件，无需预先注册 node ID；若组件改了名导致 token 失配，会在 `warnings` 里报出来。新组件 / 新范式的接入约定见 [assembly-spec.md §4](design/assembly-spec.md)。

---

## 默认 Relay 目标

- **文件 fileKey**：`2059170750769684481`
- **页面 pageId**：`0:2`
- 每次写入前先切换页面：
  ```javascript
  await relay.setCurrentPageAsync(relay.root.children.find(p => p.id === '0:2'))
  ```

---

## 文件结构

```
对话流markdown/
├── CLAUDE.md                    ← 本文件（入口 + 项目约束）
├── design/
│   ├── content-schema.md        ← 内容 Schema（LLM 产出契约）★ 核心
│   ├── assembly-spec.md         ← 拼装规范（区块词表/间距模型/范式参考板）★ 核心
│   ├── ai-reply-design.md       ← 视觉规范权威源（token / 字段 spec）
│   └── relay-api.md             ← Relay 手写手册（已降级为渲染器内部参考）
├── render/
│   └── render-scheme.js         ← 确定性渲染器（冻结代码）★ 核心
├── assets/                      ← SVG 切图（资源表见 ai-reply-design.md §3.1 / relay-api.md §5.3）
└── schemes/                     ← HTML 备份（可选，非默认）
    └── [场景名]/scheme-a.html
```

---

## 注意事项

- **每次只生成 1 个方案**，确认后再做变体
- 写入完成后必须调用 `get_screenshot` 截图验证
- 如遇节点不存在报错，先用 `get_design_metadata` 确认节点 ID
- 视觉值 vs 研发值的换算见 [ai-reply-design.md §1.3](design/ai-reply-design.md)
