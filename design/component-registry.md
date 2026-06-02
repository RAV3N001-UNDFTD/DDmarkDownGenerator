---
version: "1.0"
scope: "组件注册表 + 拼接说明（对齐设计师维护的本地组件库 + 画板 17:1747 装配方式）"
related:
  schema: "design/content-schema.md"
  renderer: "render/render-scheme.js"
source_board: "relay node 17:1747（整稿装配范例）"
last_updated: "2026-06-01"
---

# 组件注册表 + 拼接说明

> **组件由设计师维护**（本文件 page `0:2` 内的本地组件库）。本表记录逻辑名 → Relay 组件 node ID + 可设属性；渲染器据此实例化并填充。
> 装配方式（区块如何堆叠、间距如何烘焙）以画板 **17:1747** 为权威范例，见 [§3 拼接模型](#3-拼接模型)。

---

## §0 通用约定

- **文件**：fileKey `2059170750769684481`，page `0:2`。所有组件均为**本地组件**。
- **定位**：`relay.getNodeByIdAsync(nodeId)`（同文件，非 `importComponentByKeyAsync`）。
- **属性 key**：带 `#uid` 后缀且每次随机，**不可硬编码**。运行时从 `inst.mainComponent.componentPropertyDefinitions` 读取，按**基础名**匹配（⚠ `inst.componentProperties` 在 setProperties 前为空，不可用作 key 来源）。
- **改内容**：`inst.setProperties({ realKey: value })`。
- **嵌套实例**：卡内标签等是嵌套 INSTANCE，需在卡实例内 `findAll(n=>n.type==='INSTANCE')` 按名定位后单独 `setProperties`。

---

## §1 组件库清单（12 个本地组件）

| 逻辑名 | 组件名 | node ID | 类型 | 可设属性（基础名·类型） |
|---|---|---|---|---|
| `header` | 按钮/加载完成 | `17:2110` | COMPONENT | 无（固定"搞定！快来看看吧"） |
| `body` | 文本/正文 | `17:1735` | COMPONENT | `内容` TEXT |
| `h1` | 文本/一级标题 | `17:1728` | COMPONENT | `内容` TEXT |
| `h2` | 文本/二级标题 | `17:1733` | COMPONENT | `内容` TEXT |
| `more_btn` | 按钮/更多按钮 | `17:2100` | COMPONENT | 无（固定"更多 >"） |
| `all_products` | 按钮/全部商品按钮 | `17:1745` | COMPONENT | 无（固定"全部商品 >"） |
| `product_card_h` | 商品卡 / P_card_h | `17:1693` | COMPONENT | 见 §2 |
| — | 标签/模式标 | `17:1715` | COMPONENT | `文本` TEXT, `自营` TEXT（卡内为内嵌帧，非实例，文字固定"自营"） |
| — | 标签/促销标签 | `17:1711` | COMPONENT | `文本` TEXT（卡内嵌套实例） |
| — | 标签/服务标签 | `17:1713` | COMPONENT | `文本` TEXT（卡内嵌套实例） |
| — | 按钮/购买按钮 | `17:1695` | COMPONENT | 无（卡内嵌套） |
| — | 按钮/收藏按钮 | `17:1702` | COMPONENT | 无（卡内嵌套） |
| `product_card_v2` | 商品卡 / P_card_v2 | `18:79` | COMPONENT | 见 §2（13 个属性，单次 setProperties 搞定） |

> 后 5 个是 `product_card_h` 内部使用的子组件，不单独出现在装配层。

---

## §2 product_card_h（商品横卡）

| 项 | 值 |
|---|---|
| **逻辑名** | `product_card_h` |
| **node ID** | `17:1693` |
| **整体** | 343×102，自营标 + 双行标题 + 标签行(促销1+服务2) + 价格行(¥ + 数字 + 销量 + 购买按钮) |
| **状态** | ✅ 设计师维护 |

### 卡级属性（`inst.setProperties`，5 个）

| schema 字段 | 组件属性基础名 | 类型 | 说明 |
|---|---|---|---|
| `ziying` | 自营标显示 | BOOLEAN | true 显示左上「自营」模式标 |
| `name1` | 商品标题1 | TEXT | 第一行（组件内截断） |
| `name2` | 商品标题2 | TEXT | 第二行/规格 |
| `price` | 价格数字 | TEXT | 纯数字，不含 ¥（¥ 组件内固定） |
| `sold` | 销量文案 | TEXT | 如「已售10万+」 |

### 卡内嵌套标签（在卡实例内按名定位后单独设）

| schema 字段 | 嵌套组件 | 数量 | 属性 | 渲染器行为 |
|---|---|---|---|---|
| `promo` | 标签/促销标签 | 1 | `文本` | 有值则设文字，无值 `visible=false` |
| `services[]` | 标签/服务标签 | 2 | `文本` | 依次填，多余的 `visible=false` |

> ⚠ 卡**无标签显隐布尔**，渲染器靠对嵌套实例设 `.visible` 来增减标签（标签行是 auto-layout，会自动回收空位）。`services` 超过 2 个 → 截断 + warn。
> `name2` / `sold` 无值时渲染器把对应文本节点（`标题行2` / `置信字段`）`visible=false`。

---

## §3 拼接模型（以画板 17:1747 为准）

### 3.1 骨架

```
页面根 (FRAME, VERTICAL)        width 375 | padding 16 | fills WHITE
└── 内容堆叠 (VERTICAL)          FILL 宽 | itemSpacing 6      ← 区块间统一 6
    ├── [header 区块]
    ├── [body 区块]
    ├── [h1 区块]
    ├── [card 区块] × N
    ├── ...
    └── [all_products 区块]
```

**核心简化**：区块之间**统一 itemSpacing 6**，每个区块的「额外间距」烘焙进各自的包裹容器（wrapper），而不是用多级 itemSpacing。装配 = 把区块按顺序塞进 gap=6 的堆叠即可。

### 3.2 各区块的包裹规则

| 区块 | 组件 | 包裹容器 | wrapper 参数 |
|---|---|---|---|
| **header** | 按钮/加载完成 | VERTICAL wrapper | padding 下 **13**（头部与下文留白） |
| **body** | 文本/正文 | 无（直接入堆叠） | — |
| **h1** | 文本/一级标题 (+ 更多按钮) | HORIZONTAL wrapper | padding 上 **9**、`primaryAxisAlignItems=SPACE_BETWEEN`、`counterAxisAlignItems=BASELINE`、itemSpacing 12 |
| **h2** | 文本/二级标题 | 无（直接） | — |
| **card** | 商品卡/P_card_h | VERTICAL wrapper | padding 上下各 **3**（卡紧接上下文） |
| **all_products** | 按钮/全部商品按钮 | 无（直接） | — |

- **h1 行**：一级标题靠左、更多按钮靠右（SPACE_BETWEEN）。无「更多」时只放标题，仍用该 wrapper（保留 9 上 padding）。
- **连续卡片**：各自带 3/3 wrapper，堆叠 gap 6 → 卡间视觉 ≈ 3+6+3 = 12。
- 所有 wrapper `fills=[]`（透明，不盖背景）；入堆叠的实例/ wrapper 宽度 `FILL`；h1 行内的标题/更多按钮宽度 `HUG`。

### 3.3 区块顺序惯例（范例稿）

```
header → body → [h1+更多] → body → card → card → [h1+更多] → body → card → card → all_products
```

即：头部 → 开场正文 → 思路标题 → 推荐理由 → 商品卡组 → （下一思路）→ … → 全部商品入口。
内容写法见 [content-schema.md](./content-schema.md)。

---

---

## §2 product_card_v2（商品竖卡 2 列）

| 项 | 值 |
|---|---|
| **逻辑名** | `product_card_v2` |
| **node ID** | `18:79`（page `0:2`） |
| **整体** | 168×274，商卡主图 168×168 + 信息区（标题行 + 标签行 + 价格行 + 店铺名行） |
| **状态** | ✅ 已封装（封装自设计师 18:1，script 原地 createComponentFromNode，像素保真） |

### 属性映射（schema 字段 → 组件属性基础名，13 个）

| schema 字段 | 组件属性基础名 | 类型 | 说明 |
|---|---|---|---|
| `ziying` | 自营标显示 | BOOLEAN | 左上角自营标 |
| `name` | 商品标题 | TEXT | 单行截断 |
| `promo` | 促销文案 | TEXT | 红色促销标签文字；配套 显示促销标 BOOLEAN |
| — | 显示促销标 | BOOLEAN | promo 空时渲染器设 false |
| `services[0]` | 服务1文案 | TEXT | 服务标签1；配套 显示服务1 BOOLEAN |
| — | 显示服务1 | BOOLEAN | |
| `services[1]` | 服务2文案 | TEXT | 服务标签2（默认隐藏）；配套 显示服务2 BOOLEAN |
| — | 显示服务2 | BOOLEAN | |
| `price` | 价格 | TEXT | 含 ¥ 符号（如 "¥215.02"） |
| `sold` | 销量文案 | TEXT | 如"销量500+"；配套 显示销量 BOOLEAN |
| — | 显示销量 | BOOLEAN | |
| `shop` | 店铺名 | TEXT | 配套 显示店铺名 BOOLEAN |
| — | 显示店铺名 | BOOLEAN | |

> **与 P_card_h 的差异**：
> - 标签通过组件属性（TEXT+BOOLEAN）直接控制，无嵌套实例，渲染器用单次 `setProperties` 搞定，不需要 `findAll` 找嵌套组件
> - `price` 包含 ¥ 符号（P_card_h 是纯数字，¥ 固定在组件内）
> - 竖卡宽 168px，一行并排 2 张（`row_v2` 块）

---

## §3 待补组件（Phase 3）

| 逻辑名 | 对应 | 状态 |
|---|---|---|
| `product_card_v3` | 商品竖卡 3 列 | ⬜ 未开始 |
