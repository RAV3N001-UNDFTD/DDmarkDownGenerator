# CLAUDE.md

> 本项目的工作流、架构与硬规则对**所有 agent 通用**，已统一沉淀在 AGENTS.md。
> Claude Code 在此导入，避免多份副本漂移。

@AGENTS.md

---

## Claude Code 专属备注

- 调 `use_design_script` 前若有 `/use_design_script` skill，先加载；按需读 zero-design 的 `references/` 资源核对 Relay Plugin API，勿凭记忆臆测。
- 生成方案前**先读 [render/render-scheme.js](render/render-scheme.js) 全文**（AGENTS.md 铁律 1），不要凭记忆重建渲染器。
