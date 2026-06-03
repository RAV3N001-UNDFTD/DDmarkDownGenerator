# AGENTS.md · AI 对话导购助手设计稿生成（跨 agent 通用入口）

> 本文件是**所有 agent**（Claude Code / Cursor / Cline / Windsurf 等）的统一工作流入口。
> Claude Code 通过 `CLAUDE.md` 导入本文件；Cursor 通过 `.cursor/rules/` 指向本文件。

## 项目在做什么

把设计师描述的「场景」生成为 JD AI 购物助手的高保真回复稿，直接写进 Relay。

**架构（v4，两条铁律）**：
1. **布局不由 LLM 手写**。LLM 只产出**内容 schema**；布局由**冻结的渲染器**（[render/render-scheme.js](render/render-scheme.js)）+ 设计师维护的 Relay 组件库确定性还原。
2. **权威源分层防漂移**：组件（清单/ID/属性）权威源在 **Relay**，实时读取、不抄进 MD；「怎么拼」沉淀在 [design/assembly-spec.md](design/assembly-spec.md) + 渲染器。

## 前置条件

- 必须接入 **Relay / zero-design MCP**（提供 `use_design_script` 写入、`get_screenshot` 截图、`get_design_metadata` 读结构）。
  - Claude Code：已配置。
  - **其他 agent（Cursor 等）：需自行在 MCP 设置里接入同一个 zero-design（Relay）MCP**，否则只能产出 `scheme.json`（内容），无法落地渲染。
- 默认 Relay 目标：**fileKey `2059170750769684481` · pageId `0:2`**。

## 工作流（用户说「生成一个 XX 场景的方案」时）

1. **选框架 + 写 schema**：照 [design/content-schema.md](design/content-schema.md) 把场景写成一份 schema 对象（顶层 `framework` 选 `sections_h` / `grid_v` / `r_grid` / `intent_collect`）。**这是 LLM 唯一的产出**。
2. **读 [render/render-scheme.js](render/render-scheme.js) 全文**（⚠ 见铁律 1），原样粘到一次 `use_design_script` 脚本头部，末尾写 `return await renderScheme(<本次schema>)`。
3. 检查返回的 `selfCheck` 正常、`warnings` 为空。
4. 调 `get_screenshot` 截图确认。

> 没有 Relay MCP 的 agent：只做第 1 步，把 `scheme.json` 交给有 MCP 的环境渲染。

## ⚠ 硬规则

1. **生成方案必须先读 render-scheme.js 全文再用，禁止凭记忆手写/重建渲染逻辑**（会与文件漂移、丢掉已修的 bug）。
2. **不要手写 `createAutoLayout` / 节点骨架 / 间距 / 颜色**——布局全部走渲染器。
3. 渲染器按组件名 **token** 实时解析组件，无需预先注册 node ID；组件改名导致失配会在 `warnings` 里报出。
4. **每次只生成 1 个方案**，确认后再做变体。
5. 新组件 / 新拼装范式的接入约定见 [assembly-spec.md §4](design/assembly-spec.md)。

## 权威文档（按需读）

| 文件 | 作用 |
|---|---|
| [design/content-schema.md](design/content-schema.md) | **内容 Schema 契约**（4 个框架 + 字段）★ 写 schema 必读 |
| [design/assembly-spec.md](design/assembly-spec.md) | 拼装规范（框架 / 区块词表 / 间距模型 / 范式参考板 / 约定） |
| [render/render-scheme.js](render/render-scheme.js) | 确定性渲染器（冻结代码，token 实时解析）★ 生成前必读全文 |
| [design/ai-reply-design.md](design/ai-reply-design.md) | 视觉规范权威源（token / 字段 spec） |
| [design/relay-api.md](design/relay-api.md) | Relay 手写手册（已降级为渲染器内部参考 / 兜底） |

## 封装新组件

设计师发来 Relay 组件设计稿链接、希望「组件化」时：见 `.claude/skills/relay-componentize/`（该 skill 描述了解析→封装→接入的完整流程；非 Claude agent 可直接把它当操作手册读）。
