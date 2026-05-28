# AI 对话导购助手 · 设计方案生成工作流

## 项目说明

本项目用于快速生成 JD AI 购物助手的回复设计方案。设计师描述场景，agent 通过 **zero-design MCP（`use_design_script`）直接写入 Relay**，无需生成 HTML 中间文件。

---

## 设计规范（**写入前必读**）

- 📐 **规范 / token / 组件字段 spec** → [design/ai-reply-design.md](design/ai-reply-design.md)
- 🛠 **Relay 节点骨架 / API 顺序 / 写入前 checklist** → [design/relay-api.md](design/relay-api.md)

> 本文件**不再维护规范副本**。颜色 / 字号 / 间距 / 组件结构请只到上述两份查询，避免漂移。

---

## 快速开始

用户说「生成一个 XX 场景的方案」时：

1. 确认目标 Relay 节点链接（用户提供，或沿用上次链接）
2. 翻 [ai-reply-design.md §4 组合范式](design/ai-reply-design.md) 选模式（A / B / C）
3. 翻 [relay-api.md §6 写入前 checklist](design/relay-api.md) 过一遍
4. 通过 `use_design_script` **分批写入 Relay**（每批 ≤ 10 个节点操作）
5. 写完调用 `get_screenshot` 截图确认

> 如需 HTML 预览备份，可另存 `schemes/[场景名]/scheme-a.html`，但**不作为默认输出**。

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
│   ├── ai-reply-design.md       ← 设计规范权威源（视觉 / token / 字段 spec）
│   └── relay-api.md             ← Relay 实现手册（节点骨架 / API 坑 / checklist）
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
