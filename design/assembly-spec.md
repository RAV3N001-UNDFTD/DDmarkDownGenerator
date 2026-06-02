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

## §2 拼装模型（间距 / wrapper）

**核心简化**：区块之间**统一 itemSpacing 6**，每个区块的额外间距烘焙进各自 wrapper。

```
页面根 (VERTICAL)  width 375 | padding 16 | fills WHITE | itemSpacing 6
└── 区块 × N（按 schema.blocks 顺序）
```

| 区块 | wrapper | wrapper 参数 |
|---|---|---|
| header | VERTICAL | padding 下 **13** |
| body / h2 | 无 | 直接入堆叠 |
| h1 | HORIZONTAL | padding 上 **9**、SPACE_BETWEEN、counterAxis BASELINE、itemSpacing 12（标题左 / 更多按钮右） |
| card | VERTICAL | padding 上下各 **3** |
| row_v | HORIZONTAL | itemSpacing **7**（竖卡横排，FILL 均分） |
| filter_card / r_card_scheme / all_products | 无 | 组件自带完整布局，直接入堆叠 |

---

## §3 范式参考板索引

> 新拼装范式的**几何真相在参考板**（设计师在 Relay 拼好的板）。本表只记指针；要核对/更新时**重新测量板**，不信本文档里的数字。

| 范式 | 参考板 / 组件 | 一句意图 | 渲染器 handler |
|---|---|---|---|
| 基础对话流（header/body/h1/card 堆叠 + 间距模型）| 板 `17:1747` | 思路+商品卡的标准回复流 | appendFixed/TextBlock/H1/CardH |
| 竖卡横排 | `P_card_v` 组合 | 1-2 张竖卡并排对比 | appendRowV |
| 筛选流 | `筛选卡`（含 一级标题 + 3 选项变体）| 引导问题，每题选项可单选高亮 | appendFilterCard |
| 商品网格 | `R_cardScheme`（3×2 F_card）| 一段思路文案配一屏商品网格 | appendRScheme |

---

## §4 扩库 / 加范式约定（给设计师 & componentize skill）

1. **稳定 token 命名**：组件名保留稳定 token（如 `P_card_h`），可自由加前缀/后缀，但别改 token。
2. **内容尽量走组件属性**（TEXT/BOOLEAN），让渲染器用通用 `setProps(基础名)` 填充——这样加同类组件时渲染器零改动。
3. **可变数量的子元素用嵌套实例**，命名统一（标签 = `促销标`/`服务标`）。
4. **新拼装范式** = 在 Relay 拼一块参考板 + 给我一句意图。我负责测量、写 handler、在 §1/§3 登记。
5. **维护成本只跟「新范式」走，不跟组件数量走**——这是本架构的目标。
