---
name: relay-componentize
description: >
  把 Relay 里设计好的「组件设计稿」封装成带属性的 master 组件。当用户发来一个 Relay
  节点链接（relay.jd.com/file/design?...node_id=...）并希望「封装组件 / 做成组件 /
  组件化 / componentize / 帮我把这个建成组件」时使用。按本项目现有组件库（P_card_h、
  文本/正文、标签/促销标签 等）的命名与属性约定，在 Relay 里建好组件、关联 component
  properties、并注册进 content-schema / component-registry / render-scheme，供用户检查微调。
---

# Relay 组件封装 skill

把设计师画好的一个组件设计稿，确定性地封装成可被 [render/render-scheme.js](../../../render/render-scheme.js) 实例化的 master 组件。

> **原则**：组件是设计师的权威源，封装要 **100% 保真原设计的像素**，agent 只负责"加属性 + 关联 + 注册"，最后交用户检查微调。**用 `createComponentFromNode` 在克隆体上原地转组件，绝不重画。**

---

## 0. 前置（每次必做）

1. 从链接解析 `fileKey` / `nodeId`（`node_id=17:1747`；若是 `17-1747` 形式把 `-` 换 `:`）。
2. 读 **[design/component-registry.md](../../../design/component-registry.md)** 了解现有组件的命名/属性约定（要对齐，别另造一套）。
3. 加载 zero-design 的 use_design_script 资源：`use-design-script/SKILL.md`、`references/relay-plugin-api-index.md`、`references/component-patterns.md`（API 范式）。**写组件 API 前先核对，别凭记忆臆测。**

---

## 1. 解析设计稿

- `get_design_metadata(nodeId)` 看节点树；`get_screenshot(nodeId)` 看视觉。
- 用 `use_design_script` dump 结构：列出所有 TEXT 节点（characters）、子帧、疑似「标签/按钮/图片/图标」的子结构，记录各自的 **node name** 和层级。
- 判断哪些是**可变内容**（要做成属性），哪些是**固定结构**（不动）。

---

## 2. 规划属性（对齐现有库命名）

把可变内容按角色映射成 component property：

| 设计稿里的元素 | 属性类型 | 命名约定（沿用现有库） |
|---|---|---|
| 可变文本（标题/价格/文案） | `TEXT` | 按角色：`商品标题1`/`商品标题2`/`价格数字`/`销量文案`；纯文本组件用 `内容` |
| 可选显隐的元素（自营标/某行/某标签） | `BOOLEAN` | `XX显示` / `显示XX`（如 `自营标显示`） |
| 可替换图标 | `INSTANCE_SWAP` | 角色名（如 `图标`） |
| 多状态（慎用，会变体爆炸） | `VARIANT` | 仅当确有离散状态时；优先用 BOOLEAN/嵌套实例替代 |

命名风格参考现有库：组件名用 `分类/名称`（`商品卡 / P_card_h`、`文本/正文`、`标签/促销标签`、`按钮/购买按钮`）。

> **颜色不要做成 VARIANT 组件集**（爆炸）。固定色槽位或拆成不同子组件，参考 P_card_h 的促销/服务标签（固定色 + 文本属性）。

---

## 3. 封装（克隆 → 原地转组件）

```js
const src = await relay.getNodeByIdAsync('<nodeId>')
const clone = src.clone()                 // 不动原设计稿
const comp = relay.createComponentFromNode(clone)   // 原地转 COMPONENT，像素保真
comp.name = '分类/名称'                    // 对齐命名约定
// 放到合适位置，避开 (0,0) 与已有内容
```

`createComponentFromNode` 保留原节点全部视觉与子结构，**不要 createComponent 后手工重画**。

---

## 4. 加属性 + 关联子节点（关键，漏一步属性就不生效）

```js
// addComponentProperty 返回带 #uid 的 key —— 存下来，绝不硬编码、不猜
const k = comp.addComponentProperty('商品标题1', 'TEXT', '默认文案')
// 必须把属性关联到子节点，否则无效：
//   TEXT → 目标 TEXT 节点 .componentPropertyReferences = { characters: k }
//   BOOLEAN → 任意节点 { visible: k }
//   INSTANCE_SWAP → 实例节点 { mainComponent: k }
const node = comp.findOne(n => n.name === '<目标节点名>')
node.componentPropertyReferences = { characters: k }
```

- 在 clone 出来的组件里 `findOne` 按 **node name** 定位目标子节点（解析时记下的名字）。
- 单行截断的文本（商品标题这类）：`node.layoutSizingHorizontal='FILL'` → `node.textAutoResize='HEIGHT'` → `node.maxLines=1` → `node.textTruncation='ENDING'`。（否则长文案换行撑乱固定高度卡片。）
- 嵌套实例（如卡内标签）：其文本由**嵌套实例自己的属性**控制，不在外层组件暴露；渲染器到卡实例里 `findAll` 后单独 set。

---

## 5. 注册（三处，让组件可被流水线使用）

1. **[design/component-registry.md](../../../design/component-registry.md)**：§1 清单加一行（逻辑名 + node ID + 可设属性基础名）。
2. **[render/render-scheme.js](../../../render/render-scheme.js)** 的 `REGISTRY`：加 `逻辑名: 'node:id'`。
3. **[design/content-schema.md](../../../design/content-schema.md)**：若是新区块/新卡类型，加字段说明 + 示例。
4. 渲染器 `applyXXX` 逻辑：纯文本/标签类多数**无需改**（靠基础名自省驱动）；结构特殊的才扩展一个 `apply` 分支。

---

## 6. 验证 → 交用户

- 实例化自测：`createInstance()` → `setProperties(...)` 改几个字段 → 确认生效。
- `get_screenshot` 截图比对原设计稿。
- 用 §4 示例 schema 走一遍渲染器（端到端），确认 `warnings` 为空。
- 汇报：新组件 node ID、属性清单、截图，**请用户检查微调**（像素细节、属性命名、默认值由设计师定夺）。

---

## ⚠ 铁律（本项目实测踩过的坑）

- **删子节点会静默清理 BOOLEAN 属性**：从组件里 `remove()` 一个子节点后，Relay 可能自动丢弃通过 `componentPropertyReferences` 链接到该节点或其邻近节点的 BOOLEAN 属性。对于「有值才显示、无值隐藏」的需求，**渲染器用 `hideByName`（直接 `node.visible = false`）比依赖 BOOLEAN 属性更可靠**。BOOLEAN 属性留给设计师在 Relay 里手动操控用，不应作为渲染器的必要依赖。

- **`createAutoLayout(dir)` 只传 direction**；padding/itemSpacing/fills 等一律 `appendChild` 后单独赋值或 `.set({...})`（props 里会静默丢失）。
- **`inst.componentProperties` 在 setProperties 之前是空的**，不能用作 key 来源；要读 `inst.mainComponent.componentPropertyDefinitions`（组件集则取其 `parent`）。按**基础名**（去掉 `#uid`）匹配。
- **`addComponentProperty` 返回的 key 每次随机**（`商品标题1#qHeFkc`），不可硬编码。
- **属性必须 `componentPropertyReferences` 关联子节点**，只 add 不 link = 无效。
- **改实例内容用 `setProperties`**，不要直接改 `node.characters`（会被属性系统覆盖）。
- wrapper/透明帧 `fills=[]`，否则默认白底盖父背景。
- 顶层节点用 `nextTopLevelOrigin()` 避开 (0,0)。

## 参考

- 现有组件约定 / 拼接模型 → [design/component-registry.md](../../../design/component-registry.md)
- API 范式（创建/属性/实例/自省 helper）→ zero-design 资源 `references/component-patterns.md`
- 注册落点 → [render/render-scheme.js](../../../render/render-scheme.js)
