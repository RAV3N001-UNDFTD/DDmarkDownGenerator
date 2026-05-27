---
version: "1.0"
scope: "JD AI购物助手 · 对话流回复设计规范"
last_updated: "2026-05-26"
source:
  markdown_spec:    "relay node 400:4603"
  card_spec:        "relay node 400:4776"
  composition_spec: "relay node 400:1668"
---

# AI 对话导购助手 · 设计规范

## 概述

本规范定义 AI 导购助手**回复内容本身**的排版和组件标准，不涉及对话气泡外框、导航栏等 UI 容器。

输出页面宽度 **375px**，左右各留 **16px** 边距，**内容有效宽度 343px**。

---

## 1. 基础信息

| 属性 | 值 |
|------|-----|
| 页面宽度 | 375px |
| 左右边距 | 16px |
| 内容宽度 | 343px |
| 字体族 | PingFang SC（PingFang-SC） |
| 主文字色 | #171A26 |
| 段落文字色 | #3D414D |
| 品牌红（价格/购买） | #FF0F23 |
| 卡片容器背景 | #F5F6FA |

---

## 2. Markdown 文本规范

### 2.1 文本类型一览

| 类型 | 字号 | 字重 | 行高 | 颜色 | 备注 |
|------|------|------|------|------|------|
| 一级标题 H1 | 16px | Semibold 600 | 28px | #171A26 | |
| 二级标题 H2 | 14px | Semibold 600 | 24px | #171A26 | |
| 段落文本 | 14px | Regular 400 | 24px | #3D414D | 正文主力样式 |
| 结构化文本（列表） | 14px | Regular 400 | 24px | #171A26 | 见 2.2 |
| 强调文本（仅加粗） | 14px | Semibold 600 | 24px | #171A26 | 混排在段落中 |
| 强调文本（加粗+波浪线） | 14px | Semibold 600 | — | #171A26 | 波浪线高 3px |
| 可交互文本（无 icon） | 14px | Semibold 600 | 24px | #171A26 | 紫色下划线，见 2.3 |
| 可交互文本（有 icon） | 14px | Semibold 600 | 24px | #171A26 | **仅评价内容**使用 |

### 2.2 结构化文本（列表）规则

- 圆点尺寸：**5×5px**，颜色 #171A26，实心圆
- 圆点与文字水平间距：**8px**
- 列表项之间垂直间距：**6px**
- 文本与圆点均在同一行高 24px 的容器内垂直居中

```
•  建议在医生或药师指导下使用，避免过量补充。      ← 行高24  项间距6
•  服用期间注意饮食均衡…                         ← 行高24
•  如果出现胃肠道不适，建议饭后服用。             ← 行高24
↑  ← 圆点5px ← 8px gap →  文字 14px/Regular
```

### 2.3 可交互文本（无 icon）规则

- 紫色下划线粗细：**4px**，颜色 **#EADAFB**
- 下划线与文字底部错开间距：**1px**
- 可交互文本与前后常规文本水平间距：**2px**

```
适合出去玩的服饰有这些，[连衣裙]、[防晒衣] 都是非常…
                         ↑          ↑
                     粗4px紫线   粗4px紫线
                  ← 2px →    ← 2px →
```

### 2.4 强调文本（加粗+波浪线）规则

- 字重 Semibold 600
- 波浪线高度 **3px**，紧贴文字下方（与文字无额外间距）
- 波浪线颜色跟随文字色 #171A26

---

## 3. 对话卡片规范

### 3.1 卡片通用规则

| 属性 | 值 |
|------|-----|
| 卡片容器背景 | #F5F6FA |
| 卡片容器圆角 | 12px |
| 卡片容器内边距 | 8px |
| 价格颜色 | #FF0F23 |
| 自营标签 | 红底白字"自营" |

---

### 3.2 单商品横卡（horizontal card）

适用场景：单品推荐、重点推荐一个商品。

**外层容器**：背景 `#F5F6FA`，圆角 `12px`，内边距 `8px`，水平排列 gap `12px`

**图片区（左侧）**：
- 尺寸 `86×86px`，圆角 `8px`，占位背景 `#D8D9DE`，`position: relative`
- 收藏图标叠加：`position: absolute; top:4px; left:4px`，`16×16px` SVG，`backdrop-filter: blur(4px)`，圆角 `4px`

**内容区（右侧 flex:1）**：
- 高度 `86px`，`padding-top: 4px`，`flex-col`，`justify-content: space-between`

**上部分**（flex-col, gap 5px）：
- 行1（flex-row, gap 4px, align-items: flex-start）：`自营` SVG（`26×14px`，红底白字）+ 商品名（`14px / 500 / lh:14px / #171A26`，最多 2 行）

**下部分**（flex-col, gap 6px）：
- 促销标签行（flex-row, gap 4px）：
  - `满200减20`：`56×14px` SVG，红色边框 `rgba(255,15,35,0.30) 0.33px`，文字 `#FF0F23 10px/400`
  - `7天价保`：`42×14px` SVG，棕色边框 `rgba(181,105,26,0.30) 0.33px`，文字 `#B5691A 10px/400`
  - `闪电退款`：`46×14px` SVG，棕色边框 `rgba(181,105,26,0.30) 0.33px`，文字 `#B5691A 10px/400`
- 价格+操作行（flex-row, space-between）：
  - 左：`¥`（`12px/600/#FF0F23/lh:14px`）+ 价格数字（`16px/600/#FF0F23/lh:14px`）+ gap `8px` + 已售（`12px/400/#828794`）
  - 右：`65×24px` 分体按钮 SVG（左侧白底加购图标 / 右侧 `#FF0F23` 购买文字）

**SVG 资源路径（assets/）**：
| 文件 | 尺寸 | 用途 |
|------|------|------|
| `自营标签.svg` | 26×14 | 自营角标 |
| `促销标.svg` | 56×14 | 满200减20 |
| `服务标签1.svg` | 42×14 | 7天价保 |
| `服务标签2.svg` | 46×14 | 闪电退款 |
| `收藏.svg` | 16×16 | 收藏叠加图标 |
| `加购 & 购买按钮.svg` | 65×24 | 分体操作按钮 |

---

### 3.3 多商品竖卡（vertical card）

适用场景：多商品并排展示、对比推荐。

#### 瀑布流竖卡（2列）

| 字段 | 规格 |
|------|------|
| 商品图片 | 168×168px，1:1，顶部 |
| 自营标签 | 叠加在图片左上角 |
| 商品名称 | 14px / 500 weight，最多 2 行 |
| 促销标签 | 满减 / 价保 / 闪电退款（10px） |
| 价格 | #FF0F23 |
| 已售数量 | |
| + 按钮 | 右下角 |
| 店铺名称 | 12px，末尾带 `>` |

#### 一行三（3列）

| 字段 | 规格 |
|------|------|
| 商品图片 | 111×111px，1:1，顶部 |
| 自营标签 | 叠加图片左上角 |
| 商品名称 | 简短，最多 2 行 |
| 价格 | #FF0F23 |
| + 按钮 | 右下角 |
| 促销标签/店铺名 | **省略**（布局偏窄） |

---

## 4. 卡片文本组合范式

### 4.1 整体布局原则

- 页面宽度 375px，内容区 343px（左右各 16px margin）
- AI 回复内容区为**白色背景**
- 文本内容块与卡片块**垂直堆叠**

### 4.2 文本内容块样式

```
背景:    white
内边距:  16px（四边）
圆角:    12px（视整体容器决定）
宽度:    343px
```

### 4.3 卡片区域样式

```
背景:    #F5F6FA
内边距:  8px
圆角:    12px
宽度:    343px
```

### 4.4 文本 + 单商卡 组合

```
[ 文本内容块              ]   ← padding 16px
  一级标题 / 正文段落...
  
[ 单商品横卡              ]   ← background #F5F6FA
  [图片86×86] [商品信息]
```

- 文本块与卡片块之间间距：**24px**（一级间距）

### 4.5 文本 + 多商卡 组合

两种子模式：

**A. 分段文本 + 各自对应卡片（交替排列）**

```
[ 文本内容块 ]           ← 一段描述 + 对应商品标题
  ↓ 24px
[ 商品卡 ]
  ↓ 24px
[ 文本内容块 ]           ← 下一段描述 + 对应商品标题
  ↓ 24px
[ 商品卡 ]
```

**B. 文本 + 多商卡列表（可折叠）**

```
[ 文本内容块 ]
  ↓ 24px
[ 商品卡 1 ]
[ 商品卡 2 ]
[ 商品卡 3 ]（默认折叠部分）
  ↓
[ 展开全部 ▼ ]
  ↓
[ 全部商品 > ]            ← 跳转链接
```

- 多商卡列表中卡片之间间距：**10px**
- 「展开」按钮上下间距：**3px**
- 「全部商品 >」按钮上间距：**3px**

### 4.6 间距规则汇总

| 间距层级 | 数值 | 用途 |
|----------|------|------|
| 一级间距 | 24px | 文本块 ↔ 卡片块之间 |
| 二级间距 | 10–13px | 模块内主要元素之间 |
| 三级间距 | 6–8px | 同类小元素之间（列表项、标签等） |
| 最小间距 | 2–3px | 紧邻元素（按钮、inline 文本） |

---

## 5. AI 消费字段

> 以下 YAML 供 Agent 生成 HTML / Relay 脚本时直接读取。

```yaml
page:
  width: 375
  margin_horizontal: 16
  content_width: 343
  font_family: "PingFang SC"
  background: "#FFFFFF"

colors:
  text_primary:   "#171A26"
  text_body:      "#3D414D"
  price:          "#FF0F23"
  brand_red:      "#FF0F23"
  interactive_underline: "#EADAFB"
  card_bg:        "#F5F6FA"
  page_bg:        "#FFFFFF"

typography:
  h1:      { size: 16, weight: 600, lineHeight: 28, color: "#171A26" }
  h2:      { size: 14, weight: 600, lineHeight: 24, color: "#171A26" }
  body:    { size: 14, weight: 400, lineHeight: 24, color: "#3D414D" }
  list:    { size: 14, weight: 400, lineHeight: 24, color: "#171A26" }
  bold:    { size: 14, weight: 600, lineHeight: 24, color: "#171A26" }
  interactive: { size: 14, weight: 600, lineHeight: 24, color: "#171A26",
                 underline_color: "#EADAFB", underline_height: 4, underline_gap: 1,
                 gap_from_regular_text: 2 }

list_style:
  dot_size:   5
  dot_color:  "#171A26"
  dot_text_gap: 8
  item_gap:   6

cards:
  container:
    background: "#F5F6FA"
    border_radius: 12
    padding: 8

  horizontal_card:
    width: 343
    image_size: 86       # square px
    image_text_gap: 12
    variants: [regular, ranking]
    fields_regular:  [tag_zying, title, promo_tags, price, sold_count, buy_button]
    fields_ranking:  [ranking_label, tag_zying, title, promo_tags, price, sold_count, buy_button]

  vertical_card_2col:
    image_size: 168      # square px
    fields: [tag_zying, title, promo_tags, price, sold_count, add_button, shop_name]

  vertical_card_3col:
    image_size: 111      # square px
    fields: [tag_zying, title, price, add_button]
    omit:  [promo_tags, shop_name]

spacing:
  section_gap:    24     # 文本块 ↔ 卡片块
  element_gap:    10     # 模块内主要元素
  card_item_gap:  10     # 多商卡之间
  list_item_gap:   6     # 列表项之间
  list_dot_gap:    8     # 圆点与文字
  button_gap:      3     # 展开/全部商品按钮

composition_rules:
  single_product:
    pattern: "text_block → horizontal_card"
    gap: 24

  multi_product_interleaved:
    pattern: "text_block → card → text_block → card → ..."
    gap: 24

  multi_product_list:
    pattern: "text_block → [card×N, collapsible] → expand_btn → all_products_link"
    card_gap: 10
    default_visible: 2
```
