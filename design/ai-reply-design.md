---
version: "2.0"
scope: "JD AI 购物助手 · 对话流回复设计规范（agent-first 单一权威源）"
source:
  markdown_spec:    "relay node 400:4603"
  card_spec:        "relay node 400:4776"
  composition_spec: "relay node 400:1668"
related:
  implementation:  "design/relay-api.md"
last_updated: "2026-05-28"
---

# AI 对话导购助手 · 设计规范

> **本文档为 agent 写入 Relay 的权威数据源。**
> 视觉值与研发值同表给出；Relay 节点骨架 / API 顺序 / 写入前 checklist 请翻 [design/relay-api.md](./relay-api.md)。

---

## §0 Agent 速查索引

| 我要... | 看这里 |
|---|---|
| 颜色 token | §1.1 |
| 字体 token | §1.2 |
| 间距 token（视觉 & 研发） | §1.3 |
| 圆角 token | §1.4 |
| 页面几何 | §1.5 |
| 文本块（H1/H2/正文/列表/可交互） | §2 |
| 商品横卡字段 spec | §3.1 |
| 商品竖卡 2 列字段 spec | §3.2 |
| 商品竖卡 3 列字段 spec | §3.3 |
| 组合范式 + Relay 骨架（A / B / C） | §4 |
| 间距分层应用 + root 必带属性 | §5 |
| 页面骨架代码 (section_wrapper 模式) | [relay-api.md §4.2](./relay-api.md) |
| 商品横卡骨架代码 | [relay-api.md §4.3](./relay-api.md) |
| createAutoLayout props 陷阱 | [relay-api.md §1.5](./relay-api.md) |
| 写入前 checklist | [relay-api.md §6](./relay-api.md) |

---

## §1 全局 Tokens

### 1.1 Colors（hex + Relay 0-1 同表）

| name | hex | rgb_0_1 | 用途 |
|---|---|---|---|
| `primary` | `#171A26` | `{ r:0.0902, g:0.1020, b:0.1490 }` | 主文字 / H1 / H2 / 列表 / 强调 / 商品名 |
| `body` | `#3D414D` | `{ r:0.2392, g:0.2549, b:0.3020 }` | 正文段落 |
| `price` / `brand_red` | `#FF0F23` | `{ r:1, g:0.059, b:0.137 }` | 价格 / 自营 / 满减 / 购买按钮 |
| `brown` | `#B5691A` | `{ r:0.710, g:0.412, b:0.102 }` | 价保 / 退款服务标签 |
| `sold_gray` | `#828794` | `{ r:0.510, g:0.529, b:0.580 }` | 已售数量 / 店铺名 |
| `card_bg` | `#F5F6FA` | `{ r:0.9608, g:0.9647, b:0.9804 }` | 卡片容器背景 |
| `img_placeholder` | `#D8D9DE` | `{ r:0.847, g:0.851, b:0.871 }` | 商品图占位 |
| `white` / `page_bg` | `#FFFFFF` | `{ r:1, g:1, b:1 }` | 内容区背景 / 加购底色 / 白文字 |
| `interactive_underline` | `#EADAFB` | — | 可交互文本紫色下划线 |
| `collect_overlay` | `rgba(0,0,0,0.16)` | `{ r:0, g:0, b:0, a:0.16 }` | 收藏 wrapper 半透明背景 |
| `stroke_red_30` | `rgba(255,15,35,0.30)` | `{ r:1, g:0.059, b:0.137, a:0.30 }` | 满减标签描边 |
| `stroke_brown_30` | `rgba(181,105,26,0.30)` | `{ r:0.710, g:0.412, b:0.102, a:0.30 }` | 服务标签描边 |

### 1.2 Typography

字体族：`PingFang SC`（fallback：`-apple-system`, `Helvetica Neue`, sans-serif）。
Relay 字体需 `loadFontAsync` 加载 Semibold / Medium / Regular 三个 style（详见 [relay-api.md §1.1](./relay-api.md)）。

```yaml
# 文本块字体
h1:            { size: 16, weight: 600, lineHeight: 28, color: primary }
h2:            { size: 14, weight: 600, lineHeight: 24, color: primary }
body:          { size: 14, weight: 400, lineHeight: 24, color: body }
list:          { size: 14, weight: 400, lineHeight: 24, color: primary }
bold:          { size: 14, weight: 600, lineHeight: 24, color: primary }
interactive:   { size: 14, weight: 600, lineHeight: 24, color: primary,
                 underline: { color: interactive_underline, height: 4, gap_from_text: 1 } }
emphasis_wave: { size: 14, weight: 600, color: primary,
                 wave: { color: primary, height: 3, gap_from_text: 0 } }

# 卡片字段字体
name:          { size: 14, weight: 500, lineHeight: 14, color: primary }
tag_zying:     { size: 10, weight: 600, lineHeight: 9,  color: white }
tag_promo:     { size: 10, weight: 400, lineHeight: 9 }   # color 跟标签类型（red/brown）
price_sym:     { size: 12, weight: 600, lineHeight: 14, color: price }
price_num:     { size: 16, weight: 600, lineHeight: 14, color: price }
sold:          { size: 12, weight: 400, lineHeight: 12, color: sold_gray }
buy_btn:       { size: 12, weight: 500, lineHeight: 12, color: white }
shop_name:     { size: 12, weight: 400, lineHeight: 16, color: sold_gray }
```

### 1.3 Spacing（视觉值 + 研发写入值）

> 文字行高自带上下各约 6px 的视觉留白。「研发值」已扣除行高贡献，是 Relay `itemSpacing` / `padding` 应写入的真值。**写 Relay 用研发值**。

| name | 视觉值 | 研发值 | 行高贡献 | 用途 |
|---|---|---|---|---|
| `section_gap` | 24 | **13** | +6/+5 各端 | 文本块 ↔ 文本块 底部 margin |
| `h1_top` | 24 | **7** | +6 顶端 | H1 顶部 margin |
| `card_top` | 紧接 | **3** | +6 顶端 | 商品卡顶部 margin |
| `card_bottom` | 紧接 | **3** | +6 顶端 | 商品卡底部 margin |
| `card_inter_gap` | 10 | **10** | — | 多商品卡之间 |
| `h2_body_gap` | 16 | **6** | +5×2 | H2 → 正文 / 正文 → 正文 |
| `list_item_gap` | 6 | **6** | — | 列表项之间 |
| `list_dot_gap` | 8 | **8** | — | 圆点 ↔ 文字 |
| `card_inner_pad` | 8 | **8** | — | 卡片内边距 |
| `card_img_gap` | 12 | **12** | — | 卡内图片 ↔ 内容区 |
| `page_pad` | 16 | **16** | — | 页面左右 padding |
| `expand_btn_gap` | 3 | **3** | — | 展开 / 全部商品按钮上下 |

### 1.4 Radii

| name | 值 | 用途 |
|---|---|---|
| `card_radius` | 12 | 卡片容器 / 文本块容器 |
| `img_radius` | 8 | 商品图 |
| `tag_radius` | 2 | 自营 / 促销 / 服务标签 |
| `collect_radius` | 4 | 收藏 wrapper |
| `btn_radius` | 6 | 分体按钮（左半 r-tl/r-bl；右半 r-tr/r-br） |

### 1.5 Page geometry

| name | 值 |
|---|---|
| `page_width` | 375 |
| `page_pad_h` | 16 |
| `content_width` | 343 |

---

## §2 文本块

### 2.1 类型一览

字体 spec 已定义在 §1.2。用法：

| 类型 | 用法 |
|---|---|
| **H1** | 段落标题 / 思路标题（"思路一"、"推荐款一"等），段落级标题统一用 H1 |
| **H2** | 副标题 / 商品名等次级场景，**不**用作段落级标题 |
| **正文** | 普通段落（color: `body`） |
| **列表项** | 见 §2.2 |
| **强调（加粗）** | 段落内混排 |
| **强调（加粗+波浪）** | 波浪线高 3，紧贴文字底（gap 0），颜色同文字 |
| **可交互文本（无 icon）** | 紫色下划线粗 4、文字底距 1；与前后文字水平 gap 2 |
| **可交互文本（有 icon）** | **仅评价内容**使用 |

### 2.2 列表项规则

- 圆点尺寸：**5×5**，颜色 `primary`，实心圆
- 圆点 ↔ 文字水平间距：**8**
- 列表项之间垂直间距：**6**
- 文本与圆点均在行高 24 的容器内垂直居中

```
•  示例文字 1               ← 行高 24
•  示例文字 2               ← 项间距 6
↑← 5 圆点 — 8 gap → 文字 14/Regular
```

### 2.3 可交互文本（无 icon）

```
适合出去玩的服饰有这些，[连衣裙]、[防晒衣] 都是非常…
                       ↑          ↑
                  粗 4 紫线    粗 4 紫线
                ← 2 →    ← 2 →
```

### 2.4 Relay 实现

→ [relay-api.md §3 文字节点](./relay-api.md)

---

## §3 商品卡

> **§3 字段 spec 是「建 master 组件」与「写 schema」的共同权威源。** 字段命名需与组件属性、[content-schema.md](./content-schema.md) 的 card 字段、[assembly-spec.md](./assembly-spec.md) 的区块词表保持一致，避免漂移。

### 3.1 商品横卡（horizontal card）

**用途**：单品推荐 / 多商品列表（卡间 `card_inter_gap` 10）。

**整体几何**：
- 外层：宽 343（content_width）/ 高 102（86 图片 + padding 8×2）
- 背景 `card_bg` / 圆角 `card_radius` / `padding: 8` / 内部 HORIZONTAL `gap: 12`

**视觉示意**：
```
┌─────────────────────────────────────────┐
│ ┌──86──┐  自营  商品名第一行（截断）...  │
│ │  img │  商品名第二行（副标题/规格）    │
│ │ 收藏 │  [满200减20] [7天价保] [闪电退]│
│ └──86──┘  ¥215  已售1万+    [🛒|购买]   │
└─────────────────────────────────────────┘
```

**字段 spec**（每字段含 font / color / sizing / padding，可直接复制到 Relay 脚本）：

```yaml
img_frame:
  size: 86×86  fill: img_placeholder  radius: img_radius  clipsContent: true

collect_wrapper:                       # 叠加在 img_frame 内
  position: absolute  top: 4  left: 4
  padding: 3  bg: collect_overlay  radius: collect_radius  backdrop_blur: 4
  child:
    collect_icon: { type: svg, size: 10×10, src: assets/收藏.svg }

tag_zying:
  layout: HORIZONTAL  hug  padding: [2, 3]  radius: tag_radius  bg: price
  clipsContent: true  primaryAxisAlignItems: MIN
  text: { chars: "自营", font: tag_zying }

name_row1:                              # 商品名第一行
  font: name  sizing: FILL
  maxLines: 1  truncation: ENDING       # ⚠ 必须截断，否则 SPACE_BETWEEN 错位

name_row2:                              # 商品名第二行 / 规格副标题
  font: name  sizing: FILL

promo_tag_red:                          # 满减
  layout: HORIZONTAL  hug  padding: [2, 3]  radius: tag_radius
  stroke: { color: stroke_red_30, width: 0.33, align: INSIDE }
  clipsContent: true  primaryAxisAlignItems: MIN
  text: { chars: "满200减20", font: tag_promo, color: price }

promo_tag_brown:                        # 7天价保 / 闪电退款（同 spec，文字不同）
  layout: HORIZONTAL  hug  padding: [2, 3]  radius: tag_radius
  stroke: { color: stroke_brown_30, width: 0.33, align: INSIDE }
  clipsContent: true  primaryAxisAlignItems: MIN
  text: { chars: "7天价保" | "闪电退款", font: tag_promo, color: brown }

price_symbol: { chars: "¥",   font: price_sym }
price_number: { chars: "215", font: price_num }
sold:         { chars: "已售1万+", font: sold }
# ⚠ 字符串字面值原样使用，不要按"中英数字混排"加空格：
#   "已售1万+" ✓     "已售 1 万+" ✗
#   "¥215"   ✓     "¥ 215"     ✗

price_num_wrap:                         # ¥ 与数字底对齐 + 紧贴无间距
  layout: HORIZONTAL  hug  itemSpacing: 0  counterAxisAlignItems: MAX
  children: [price_symbol, price_number]
# ⚠ itemSpacing=0 不能写进 createAutoLayout props（会失效，详见 relay-api.md §1.5）
#   必须 append 后单独设：priceNumWrap.itemSpacing = 0
#   不设 → 默认 10 → ¥ 和数字之间出现间隙，露出背景色

split_button:
  add_btn:
    size: 24×20  bg: white  radius: { tl: 6, bl: 6 }
    child_icon_circle:
      size: 24×24  bg: transparent  radius: 24
      position: absolute  x: 0  y: -2   # ⚠ 视觉居中靠 y:-2 溢出上方
      child_cart:
        type: svg  size: 14.4×14.4  src: assets/购物车.svg
        position: absolute  x: 4.8  y: 4.8

  buy_btn:
    layout: HORIZONTAL  hug_width  fixed_height: 20
    padding: [4, 8]  bg: price  radius: { tr: 6, br: 6 }    # ⚠ 上下 4（不是 6）：4+lh12+4=20 正好居中
    counterAxisAlignItems: CENTER  primaryAxisAlignItems: CENTER
    # 不要设 clipsContent=true，让文字自然居中；旧版 6+12+6=24 + clip 会让中文 baseline 偏下
    text: { chars: "购买", font: buy_btn }

  layout: HORIZONTAL  hug  itemSpacing: 0  counterAxisAlignItems: CENTER
```

**资源**：

| 文件 | 尺寸 | 在 Relay 中的用法 |
|---|---|---|
| `assets/购物车.svg` | 14.4×14 | 直接 `createNodeFromSvg`（addBtn 内图标） |
| `assets/收藏.svg` | 16×16 | Relay 暂用 10×10 矩形占位；HTML 备份用 16×16 |
| `assets/自营标签.svg` | 26×14 | HTML 备份；Relay 改用纯 Frame+Text |
| `assets/促销标.svg` | 56×14 | HTML 备份；Relay 改用纯 Frame+Text |
| `assets/服务标签1.svg` | 42×14 | HTML 备份；Relay 改用纯 Frame+Text |
| `assets/服务标签2.svg` | 46×14 | HTML 备份；Relay 改用纯 Frame+Text |
| `assets/加购 & 购买按钮.svg` | 65×24 | HTML 备份；Relay 已拆为 addBtn + buyBtn 两节点 |

**Relay 实现** → [relay-api.md §4.3 商品横卡骨架](./relay-api.md)

---

### 3.2 商品竖卡 2 列（vertical card 2-col / 瀑布流）

**用途**：多商品并排展示、对比推荐。

**字段 spec**：

| 字段 | 规格 |
|---|---|
| `img` | 168×168，1:1，顶部 |
| `tag_zying` | 叠加图片左上角（spec 同横卡） |
| `name` | font: `name`，最多 2 行 |
| `promo_tags` | 满减 / 价保 / 闪电退款（spec 同横卡的 promo_tag_*） |
| `price` | spec 同横卡（symbol + number + wrap） |
| `sold` | spec 同横卡 |
| `add_btn` | 右下角加号按钮 |
| `shop_name` | font: `shop_name`，末尾带 `>` |

**Relay 实现** → [relay-api.md §4.4](./relay-api.md)（待补）

---

### 3.3 商品竖卡 3 列（vertical card 3-col / 一行三）

**用途**：多商品快速视觉扫描（布局偏窄）。

**字段 spec**：

| 字段 | 规格 |
|---|---|
| `img` | 111×111，1:1，顶部 |
| `tag_zying` | 叠加图片左上角 |
| `name` | font: `name`，最多 2 行，文案宜简短 |
| `price` | spec 同横卡 |
| `add_btn` | 右下角 |
| **省略** | `promo_tags` / `shop_name`（空间不足） |

**Relay 实现** → [relay-api.md §4.4](./relay-api.md)（待补）

---

## §4 组合范式

每个模式同时给出 **视觉示意**（设计师视角）+ **Relay 节点骨架**（agent 实现）。**写 Relay 时必须按骨架建分组容器，不要把所有节点平铺到 root 上**——平铺会让所有间距塌成 root 默认 itemSpacing，丢掉所有层级节奏。

> **标题层级规则**：AI 回复中的段落 / 思路标题（如"思路一"、"推荐款一"）统一用 **H1**（16 Semibold lineHeight 28）。H2 仅用于副标题或商品名等次级场景。

> **顶层介绍 vs section 内部的标题↔body 间距不同**：
> - 顶层介绍 H1+body **直接挂 root**，间距随 root.itemSpacing=13，视觉≈24（宽松）
> - section_wrapper 内部的 H1+body **包在 title_block**（itemSpacing=6），视觉≈16（紧凑）

### 4.1 模式 A · 文本 + 横卡列表

**适用**：多商品快速浏览（可折叠）

**视觉**：
```
[ 文本内容块 ]
  ↓ ≈24
[ 商品卡 1 ]
  ↓ 10
[ 商品卡 2 ]
  ↓ 10
[ 商品卡 3 ]（默认折叠部分）
  ↓ 3
[ 展开全部 ▼ ]
  ↓ 3
[ 全部商品 > ]
```

**Relay 骨架**：
```
root              VERTICAL | itemSpacing=13 | padding=16 | fills=WHITE | width=375
├── intro_block   VERTICAL | itemSpacing=6  | fills=[]   ← H1 + body
│   ├── H1
│   └── body
└── cards_block   VERTICAL | itemSpacing=10 | fills=[]   ← 多卡 wrapper
    ├── card_1    (商品横卡)
    ├── card_2
    └── card_3
```

### 4.2 模式 B · 文本 + 三列竖卡

**适用**：多商品视觉扫描

**视觉**：
```
[ 文本内容块 ]
  ↓ ≈24
┌──── 343 ────┐
│ ┌─┐┌─┐┌─┐  │   3 列竖卡 111×111
│ └─┘└─┘└─┘  │
└─────────────┘
```

**Relay 骨架**：
```
root              VERTICAL | itemSpacing=13 | padding=16 | fills=WHITE | width=375
├── intro_block   VERTICAL | itemSpacing=6  | fills=[]
│   ├── H1
│   └── body
└── grid_3col     HORIZONTAL | itemSpacing=10 | fills=[]   ← 三列横排
    ├── card_1    (竖卡 3 列)
    ├── card_2
    └── card_3
```

### 4.3 模式 C · 分段文本交替卡（推荐款一 / 思路一系列）

**适用**：每段思路有独立推荐理由 + 对应商品（最常用模式）

**视觉**：
```
[ H1 顶部介绍 ]
[ body 顶部介绍语 ]
  ↓ ≈24 (root itemSpacing=13 + 行高)
[ H1 思路一 ]
[ body 推荐理由 ]
  ↓ 卡紧接正文 (section_wrapper itemSpacing=3 + 行高)
[ 商品卡 ]
  ↓ ≈24 (root itemSpacing=13)
[ H1 思路二 ]
[ body ]
[ 商品卡 ]
```

**Relay 骨架**（**核心模式 —— 必须用 section_wrapper 分组**）：
```
root                  VERTICAL | itemSpacing=13 | padding=16 | fills=WHITE | width=375
├── H1                顶部介绍标题（直接子，不包 wrapper）
├── body              顶部介绍 body（直接子）
├── section_wrapper × N   VERTICAL | itemSpacing=3 | fills=[]   ← 每"思路+卡片组"一个
│   ├── title_block      VERTICAL | itemSpacing=6 | fills=[]
│   │   ├── H1 "思路N..."
│   │   └── body 推荐理由
│   └── cards_block      VERTICAL | itemSpacing=10 | fills=[]
│       ├── card_1
│       ├── card_2 (可选)
│       └── card_3 (可选)
└── footer_text         可选收尾（直接子）
```

⚠ **section_wrapper 是模式 C 的核心**：没有它，思路标题和商品卡之间会用 root.itemSpacing=13，视觉过松；有它且 itemSpacing=3，标题块和卡片组紧贴（"卡紧接正文"语义）。

**Relay 实现代码片段** → [relay-api.md §4.2 section_wrapper 模式](./relay-api.md)

---

## §5 间距分层应用（按 Frame 层级速查）

> ⚠ 间距不靠"决策树"算，靠**节点结构**实现。先按 §4 选模式建好骨架，每层 Frame 的 itemSpacing 按下表设：

| Frame 层级 | itemSpacing | 视觉感知 | 内容场景 |
|---|---|---|---|
| **root** | **13** | ≈24 | 主结构：顶部介绍 ↔ section_wrapper ↔ footer |
| **section_wrapper** | **3** | 卡紧接正文 | 思路标题块 ↔ 商品卡组（模式 C 专用） |
| **title_block** / **intro_block** | **6** | ≈16 | H1 ↔ body 之间 |
| **cards_block** | **10** | 10 | 多商品卡之间 |
| **list_block**（列表项容器） | **6** | 6 | 列表项之间 |
| **商品卡内 titleArea** | **5** | 5 | name_row1 ↔ name_row2 |
| **商品卡内 bottomFrame** | **6** | 6 | promoRow ↔ priceAction |
| **商品卡内 promoRow** | **4** | 4 | 多个促销标签之间 |
| **商品卡内 priceGrp** | **8** | 8 | 价格组 ↔ 已售数量 |

### 5.1 root 必带属性（绝对不要省略 / 不要用默认值）

| 属性 | 值 | 缺失后果 |
|---|---|---|
| `padding` | 16/16/16/16 | **文本贴边**，整稿看起来局促（实测最常见 bug） |
| `itemSpacing` | **13** | 间距塌成 Relay 默认 10，所有间距视觉减弱 |
| `fills` | WHITE `{r:1,g:1,b:1}` | 默认透明 → 没白底，与对话气泡背景融合 |
| `width` | 375（顶层 resize） | 节点被 HUG 撑成内容宽度 → 文本折成单字宽度 |

⚠⚠ **关键陷阱**：`relay.createAutoLayout('VERTICAL', { padding: 16, itemSpacing: 13 })` 这种 props 写法**会被静默丢弃**！实测香奈儿-v2 agent 严格按骨架建了 section_wrapper / title_block，但所有 padding 和 itemSpacing 写在 props 里全部失效，整稿仍然塌陷。

**铁律**：`createAutoLayout()` **只传 direction**；所有属性必须 `appendChild` 之后单独赋值或用 `node.set({...})`。详见 [relay-api.md §1.5](./relay-api.md)。每段骨架代码模板都在 relay-api.md §4 里给好了，**直接复制改字，不要二次发明 props 写法**。

### 5.2 transparent wrapper Frame 必清 `fills`

所有 wrapper 类（intro_block / section_wrapper / title_block / cards_block / 商品卡内的 titleArea / bottomFrame / promoRow / priceAction / priceGrp / priceNumWrap / splitBtn）必须显式设 `fills = []`，否则 Relay 默认填白色会盖掉父背景（虽然 root 也是白，但 card_bg 区域会被盖）。

---

## §6 AI 消费提示

- ✅ 所有原子值见 §1，不要去其他文件找 token，不要写死 hex
- ✅ Relay 颜色直接用 §1.1 的 `rgb_0_1` 列，不要自己换算
- ✅ 间距分"视觉值"和"研发值"，**写 Relay 用研发值**（§1.3）
- ✅ **写 Relay 前先看 §4 选模式 → 按 Relay 骨架建分组容器（intro_block / section_wrapper / title_block / cards_block）**，不要把所有节点平铺到 root（这是新版最容易犯的错）
- ✅ 每个 Frame 的 itemSpacing 按 §5 表查，root 必带四属性见 §5.1
- ✅ 商品卡字段 spec 见 §3，每字段已含 font / color / sizing / padding / maxLines 全量信息
- ✅ Relay 节点骨架 / API 顺序 / 写入前清单 → [relay-api.md](./relay-api.md)
- ✅ 写入完成调用 `get_screenshot` 验证视觉
- ❌ 不再读 `CLAUDE.md` 中的规范副本（已迁移至此）
