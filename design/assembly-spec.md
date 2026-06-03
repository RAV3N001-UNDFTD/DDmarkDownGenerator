---
version: "1.0"
scope: "拼装规范 —— 组件如何组合成页面（Relay 装不下、必须沉淀在本地的知识）"
related:
  schema: "design/content-schema.md"
  renderer: "render/render-scheme.js"
last_updated: "2026-06-02"
---

# 拼装规范（assembly-spec）

> **本文件只沉淀「怎么拼」。** 组件清单 / node ID / 属性定义的**权威源在 Relay**，不在此维护（维护副本必漂移）。
> 需要组件信息时**实时扫描 Relay**；本文件只记录从 Relay 推导不出来的东西：区块词表、拼装模型、范式参考板、约定。

---

## §1 区块词表（schema block → 组件 token）

渲染器按**组件名 token**（`name.includes(token)`）实时解析组件，**不依赖 node ID**。设计师改 ID / 加前缀 / 扩库都自动适配；只要 token 不变即可。

| schema block.type | 组件 token | schema 字段 → 组件属性 |
|---|---|---|
| `header` | `加载完成` | 无 |
| `body` | `正文` | `text` → 内容 |
| `h1` | `一级标题` | `text` → 内容；`more` → 是否并排「更多按钮」 |
| `h2` | `二级标题` | `text` → 内容 |
| `more_btn` | `更多按钮` | 无（h1 内部使用） |
| `all_products` | `全部商品按钮` | 无 |
| `card` | `P_card_h` | 见 §1.1 |
| `row_v` | `P_card_v` | 见 §1.1（横排 1-2 张） |
| `filter_card` | `筛选卡` | `title`→一级标题；`options[]`→3 个选项（变体 属性1=已选中/未选中） |
| `r_card_scheme` | `R_cardScheme` | `prices[]`→6 张 F_card 各自价格 |

> token 表与 [render-scheme.js](../render/render-scheme.js) 顶部 `TOKENS` 严格一致。新增组件 = 加一行 token + 一个 block handler。

### 1.1 商品卡字段（card / row_v 共用语义）

| schema 字段 | 落点 | 备注 |
|---|---|---|
| `name1`/`name2`（横卡）、`name`（竖卡） | 商品标题* | 组件内单行截断 |
| `price` | 价格* | **传纯数字**，¥ 由组件自带（渲染器 `stripYen` 兜底，传不传 ¥ 都安全） |
| `sold` | 销量文案 | 空则隐藏（渲染器 hideByName） |
| `ziying` | 自营标显示 | BOOLEAN |
| `promo` | 嵌套实例 `促销标` 的 文本 | 空则该标签 visible=false |
| `services[]` | 嵌套实例 `服务标` 的 文本 | ≤2 个，多余截断 |
| `shop`（仅竖卡） | 店铺名 | 空则隐藏 |

> 标签是**嵌套组件实例**（名为 `促销标`/`服务标`），渲染器 findAll 按名定位后填 文本、空则隐藏。**不靠 BOOLEAN 属性**（删子节点会静默清理 BOOLEAN refs）。

---

## §2 框架（4 种，渲染器顶层按 `framework` 分派）

> 商品推荐 3 种 + 意图收集 1 种。**每个框架的间距按各自参考板测量**（不强行统一）：框架1/2/意图收集用 pad10/gap10 扁平，框架3 用 pad16/gap6+wrapper。

| framework | 命名 | 参考板 | 结构 | 根间距 |
|---|---|---|---|---|
| `sections_h` | 框架2·横卡分组 | `18:875` | header + intro正文 + N段[h1(更多)+body+横卡×N]（段容器 gap10） | pad10 / gap10 |
| `grid_v` | 框架1·竖卡网格 | `18:860` | header + h1(更多) + body + 竖卡 2 列网格（列 gap10、列内 gap10，行优先偶左奇右，卡保持 168 原宽） | pad10 / gap10 |
| `r_grid` | 框架3·R网格配文案 | `18:936` | header(wrapper下13) + h1(wrapper上9,无更多) + body + R_cardScheme + footer正文 | pad16 / gap6 |
| `intent_collect` | 意图收集 | `18:908` | header + intro正文 + N问筛选卡（**仅末张显示「开始推荐吧」**） | pad10 / gap10 |

省略 `framework` → 走 `blocks` 扁平兜底（灵活拼，pad10/gap10）。

### 复用的区块装配规则

| 区块 | 规则 |
|---|---|
| header | 直接入堆叠（r_grid 例外：套 VERTICAL wrapper 下 padding 13） |
| body / h2（正文/二级标题）| 直接入堆叠，设 `内容` |
| h1 行 | HORIZONTAL、SPACE_BETWEEN、counterAxis BASELINE、itemSpacing 12（标题左 / 更多按钮右）；r_grid 加上 padding 9 |
| 横卡 P_card_h | 直接入段容器（无 wrapper），FILL 宽 |
| 竖卡 P_card_v | row_v/网格列内，168 原宽 |
| R_cardScheme / filter_card | 组件自带完整布局，直接入堆叠 |

---

## §3 范式参考板索引

> 新拼装范式的**几何真相在参考板**（设计师在 Relay 拼好的板）。本表只记指针 + 一句意图 + 渲染器 handler；要核对/更新时**重新测量板**，不信本文档里的数字。

| framework | 参考板 | 一句意图 | 渲染器 handler |
|---|---|---|---|
| `sections_h` | `18:875` | 按思路分段，每段标题+理由+若干横卡 | renderSectionsH |
| `grid_v` | `18:860` | 一屏竖卡网格快速浏览同类商品 | renderGridV |
| `r_grid` | `18:936` | 一段思路文案配一屏 R 商品网格 | renderRGrid |
| `intent_collect` | `18:908` | 引导多道选择题收集意图，末尾单个 CTA | renderIntent |
| （基础间距模型来源）| `17:1747` | 早期单段流参考，已并入各框架 | — |

---

## §4 扩库 / 加范式约定（给设计师 & componentize skill）

1. **稳定 token 命名**：组件名保留稳定 token（如 `P_card_h`），可自由加前缀/后缀，但别改 token。
2. **内容尽量走组件属性**（TEXT/BOOLEAN），让渲染器用通用 `setProps(基础名)` 填充——这样加同类组件时渲染器零改动。
3. **可变数量的子元素用嵌套实例**，命名统一（标签 = `促销标`/`服务标`）。
4. **新拼装范式** = 在 Relay 拼一块参考板 + 给我一句意图。我负责测量、加 `framework` 分支、在 §2/§3 登记。
5. **维护成本只跟「新范式」走，不跟组件数量走**——这是本架构的目标。
