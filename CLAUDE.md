# AI 对话导购助手 · 设计方案生成工作流

## 项目说明

本项目用于快速生成 JD AI 购物助手的回复设计方案。设计师描述场景，agent 把场景翻译成**内容 schema**，再由**确定性渲染器**渲染成 Relay 组件实例。

> **架构原则（v4，详见 [迭代计划](../../.claude/plans/abstract-mixing-stonebraker.md)）**：
> **布局不由 LLM 手写。** LLM 只产出内容 schema；布局由冻结的渲染器 + 设计师手建的 master 组件确定性还原。
> 这样换来：还原度确定、agent 输出稳定、组件调试成本一次性。

---

## 设计规范

- 📋 **内容 Schema（LLM 产出契约，必读）** → [design/content-schema.md](design/content-schema.md)
- 🗂 **组件注册表（逻辑名 → Relay 组件 ID + 属性映射）** → [design/component-registry.md](design/component-registry.md)
- ⚙️ **确定性渲染器（冻结代码，封装所有布局坑）** → [render/render-scheme.js](render/render-scheme.js)
- 📐 **视觉规范 / token / 字段 spec（建组件 + 写 schema 共同权威源）** → [design/ai-reply-design.md](design/ai-reply-design.md)
- 🛠 **Relay 手写实现手册（已降级为渲染器内部参考 / 兜底）** → [design/relay-api.md](design/relay-api.md)

> 本文件**不再维护规范副本**。颜色 / 字号 / 间距 / 组件结构请到上述查询，避免漂移。

---

## 快速开始

用户说「生成一个 XX 场景的方案」时：

1. 确认目标 Relay 节点链接（用户提供，或沿用上次链接）
2. 翻 [content-schema.md](design/content-schema.md) 把场景写成一份 `scheme.json`（**LLM 只做这一步的内容产出**）
3. （可选）把 schema 给设计师过目/微调
4. 读 [render/render-scheme.js](render/render-scheme.js) 全文，拼到 `use_design_script` 脚本头部，末尾 `return await renderScheme(<本次schema>)`
5. 检查 return 的 `selfCheck` 全绿、`warnings` 为空，再调 `get_screenshot` 截图确认

> ⚠ **不要再手写 `createAutoLayout`/节点骨架**——布局全部走渲染器。手写骨架仅在调试渲染器本身时参考 [relay-api.md](design/relay-api.md)。
> 前置依赖：schema 里用到的组件必须已在 [component-registry.md](design/component-registry.md) 注册（设计师建好 master 组件 + 填入 node ID）。

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
│   ├── component-registry.md    ← 组件注册表（逻辑名 → Relay 组件 ID + 属性映射）
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
