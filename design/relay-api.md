---
version: "1.0"
scope: "Relay 写入实现手册（agent 实现层）"
related:
  spec: "design/ai-reply-design.md"
last_updated: "2026-05-28"
---

# Relay 写入手册

> 配合 [ai-reply-design.md](./ai-reply-design.md) 使用：**规范** 在那边查（颜色 / 字号 / 间距 / 字段 spec），**实现细节** 在这里查（节点骨架 / API 顺序 / 坑 checklist）。

---

## §1 通用约束

### 1.1 字体加载（脚本最顶部必跑）

```javascript
await relay.loadFontAsync({ family: 'PingFang SC', style: 'Semibold' })  // H1/H2/自营/价格
await relay.loadFontAsync({ family: 'PingFang SC', style: 'Medium' })    // 商品名/购买按钮
await relay.loadFontAsync({ family: 'PingFang SC', style: 'Regular' })   // 正文/促销标签
```

### 1.2 页面切换（脚本最顶部必跑）

```javascript
const page = relay.root.children.find(p => p.id === '0:2')
await relay.setCurrentPageAsync(page)
```

### 1.3 分批写入

- 每批 ≤ 10 个节点操作；单次 `use_design_script` 脚本不要太长，否则失败时定位困难
- 推荐：tokens / 主容器一批 → 文本块一批 → 单卡（按卡）一批

### 1.4 颜色范围

Relay color 用 **0-1 范围**（不是 0-255）。完整 token 见 [ai-reply-design.md §1.1](./ai-reply-design.md)。

### 1.5 ⚠ createAutoLayout 的 props 参数会静默丢弃部分属性

`relay.createAutoLayout(direction, props)` 的 `props` 对象**只可靠地接收 layoutMode / padding / itemSpacing / cornerRadius / primaryAxisAlignItems / counterAxisAlignItems** 等基础布局属性。以下属性在 props 里**会被静默丢弃**（已实测，2026-05 冒烟测试发现）：

- `fills` / `strokes` / `strokeWeight` / `strokeAlign`
- `name`
- `width` / `height`
- `clipsContent`（不可靠，建议单独设）

⚠ SKILL.md 示例里写了 `createAutoLayout({ name: 'Card', ... })`，但实际 Relay 实现里 name 不会生效。**所有上述属性必须 `appendChild` 之后单独赋值。**

```javascript
// ❌ 错：fills / name 被丢，buyBtn 实际白底 → 白底白字 → "购买" 不可见
const buyBtn = relay.createAutoLayout('HORIZONTAL', {
  name: 'buyBtn',
  fills: [{ type: 'SOLID', color: PRICE }],
  itemSpacing: 0,
})

// ✅ 对：基础布局属性放 props 没问题，但 fills / name / itemSpacing 一律单独设
const buyBtn = relay.createAutoLayout('HORIZONTAL', {
  paddingLeft: 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6,
  primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER',
})
parent.appendChild(buyBtn)
buyBtn.name = 'buyBtn'
buyBtn.fills = [{ type: 'SOLID', color: PRICE }]
buyBtn.itemSpacing = 0
```

> 「布局相关属性」与「视觉/标识属性」分离写：前者可放 props，后者单独赋值。

### 1.6 顶层节点定位（避开 0,0）

页面上直接挂的顶层节点不能堆在 (0,0)，否则会与已有内容重叠。在脚本顶部用 helper 找空位：

```javascript
function nextTopLevelOrigin(spacing = 80) {
  const tops = relay.currentPage.children.filter(n => n.visible !== false && n.type !== 'SECTION')
  if (tops.length === 0) return { x: 0, y: 0 }
  const maxRight = Math.max(...tops.map(n => n.x + n.width))
  const minTop = Math.min(...tops.map(n => n.y))
  return { x: maxRight + spacing, y: minTop }
}
const { x: originX, y: originY } = nextTopLevelOrigin()
// 主容器创建后：root.x = originX; root.y = originY
```

---

## §2 Auto Layout sizing 速记

| 场景 | 推荐写法 | 注意 |
|---|---|---|
| 子节点：VERTICAL 帧 + 宽 FILL（HUG 高度） | `createAutoLayout('VERTICAL')` → `parent.appendChild` → `layoutSizingHorizontal='FILL'` | 默认双向 HUG，append 后设 FILL 即可 |
| 子节点：HORIZONTAL 行 + 宽 FILL（HUG 高度） | `createAutoLayout('HORIZONTAL')` → `parent.appendChild` → `layoutSizingHorizontal='FILL'` | ⚠ 切勿设 `counterAxisSizingMode='FIXED'`，否则锁高 |
| **顶层节点：固定宽度 + HUG 高度** | `createAutoLayout('VERTICAL')` → `page.appendChild` → `resize(W, h)` → `primaryAxisSizingMode='AUTO'` → `counterAxisSizingMode='FIXED'` | 顶层无父无法 FILL，必须 resize；详见 §4.1 |
| 固定高度 + HUG 宽（如 buyBtn） | `resize(w, h)` → `primaryAxisSizingMode='AUTO'` → `counterAxisSizingMode='FIXED'` | resize 后必须重设 sizing |
| HUG 双向 | 不调 `resize`；默认 `primaryAxisSizingMode='AUTO'` 即可 | 最简形态 |

### 2.1 关键规则

- **`resize(w, h)` 会把两个维度都重置为 FIXED**，调用后需重新设 AUTO/FILL
- **HORIZONTAL 行的 counterAxis = 高度**，默认 AUTO（HUG）。如果设 FIXED 但未 `resize()` → 高度卡在默认 100px → 布局爆框
- **FILL 必须在 `appendChild` 之后设置**，否则无效

### 2.2 代码片段（贴上即用）

```javascript
// VERTICAL HUG 容器（width FILL）
const frame = relay.createAutoLayout('VERTICAL')
frame.counterAxisSizingMode = 'FIXED'    // width → 由 FILL 接管
frame.itemSpacing = 6
parent.appendChild(frame)
frame.layoutSizingHorizontal = 'FILL'

// HORIZONTAL 行 — 不设 counterAxisSizingMode（保持 AUTO 高度 = HUG）
const row = relay.createAutoLayout('HORIZONTAL')
row.itemSpacing = 4
// ❌ 不要写 row.counterAxisSizingMode = 'FIXED' — 会锁在默认 100px 高！
parent.appendChild(row)
row.layoutSizingHorizontal = 'FILL'

// 固定高度 + HUG 宽（buyBtn 这类按钮）
const btn = relay.createAutoLayout('HORIZONTAL')
btn.resize(10, 20)                       // 先 resize 锁高度
btn.primaryAxisSizingMode = 'AUTO'       // 再设 HUG width
btn.counterAxisSizingMode = 'FIXED'      // 高度维持 20
```

---

## §3 文字节点

### 3.1 固定操作顺序

1. `loadFontAsync`（在脚本顶部统一加载）
2. `relay.createText()` + 设 `characters` / `fontName` / `fontSize` / `lineHeight` / `fills`
3. `parent.appendChild(text)`
4. `text.layoutSizingHorizontal = 'FILL'`（如需 FILL）
5. `text.textAutoResize = 'HEIGHT'`
6. （需要截断时）`text.maxLines = 1` → `text.textTruncation = 'ENDING'`

⚠ `maxLines` / `textTruncation` 必须在 FILL 之后设，否则文字宽度为 0、截断算空、文字不可见。

### 3.2 代码片段

```javascript
// 单行截断文字（商品名第一行）
const nr1 = relay.createText()
nr1.characters = '保湿面霜'
nr1.fontName = { family: 'PingFang SC', style: 'Medium' }
nr1.fontSize = 14
nr1.lineHeight = { value: 14, unit: 'PIXELS' }
nr1.fills = [{ type: 'SOLID', color: PRIMARY }]
parent.appendChild(nr1)                  // 1. 先 append
nr1.layoutSizingHorizontal = 'FILL'      // 2. 再设 FILL
nr1.textAutoResize = 'HEIGHT'            // 3. 再设 textAutoResize
nr1.maxLines = 1                         // 4. 再设 maxLines
nr1.textTruncation = 'ENDING'            // 5. 最后设 truncation
```

---

## §4 组件节点骨架

### 4.1 主容器（每次写入的根节点，顶层节点）

```javascript
const { x: originX, y: originY } = nextTopLevelOrigin()  // §1.6

// props 只放可靠属性：layoutMode + padding + itemSpacing
const root = relay.createAutoLayout('VERTICAL', {
  paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16,
  itemSpacing: 13,                             // section_gap 研发值（视觉≈24）
})
page.appendChild(root)

// 其余属性 append 后单独赋值（§1.5 createAutoLayout props 陷阱）
root.name = '场景名'
root.fills = [{ type: 'SOLID', color: { r:1, g:1, b:1 } }]
root.resize(375, root.height)                  // ⚠ 顶层节点必须 resize 设固定宽
root.primaryAxisSizingMode = 'AUTO'            // resize 后重设高度 HUG
root.counterAxisSizingMode = 'FIXED'           // 宽度固定 375
root.x = originX; root.y = originY             // 避开 (0,0)
```

### 4.2 完整页面骨架（section_wrapper 模式 / 模式 C）

参考 [ai-reply-design.md §4.3](./ai-reply-design.md)。**核心要点：root 之下不要平铺所有节点，要按"intro → section_wrapper × N → footer"分组。**

```javascript
// (顶部已按 §4.1 建好 root)
const ROOT = root

// ── helper：append 一个 H1 或 body 到 parent
function appendText(parent, chars, isH1) {
  const t = relay.createText()
  t.characters = chars
  t.fontName = { family: 'PingFang SC', style: isH1 ? 'Semibold' : 'Regular' }
  t.fontSize = isH1 ? 16 : 14
  t.lineHeight = { value: isH1 ? 28 : 24, unit: 'PIXELS' }
  t.fills = [{ type: 'SOLID', color: isH1 ? PRIMARY : BODY }]
  parent.appendChild(t)
  t.layoutSizingHorizontal = 'FILL'
  t.textAutoResize = 'HEIGHT'
  return t
}

// ── 顶部介绍：H1 + body **直接挂 root**（间距 = root.itemSpacing=13，视觉≈24）
appendText(ROOT, '顶部介绍标题', true)
appendText(ROOT, '顶部介绍 body 内容...', false)

// ── makeSection：每个「思路 + 卡片组」用一个 section_wrapper
function makeSection({ parent, titleChars, descChars, cards }) {
  // 1. section_wrapper (VERTICAL, itemSpacing=3)：title_block ↔ cards_block 紧贴
  const wrap = relay.createAutoLayout('VERTICAL', { itemSpacing: 3 })
  parent.appendChild(wrap)
  wrap.layoutSizingHorizontal = 'FILL'
  wrap.fills = []                                  // 透明 ⚠

  // 2. title_block (VERTICAL, itemSpacing=6)：H1 ↔ body 紧凑
  const titleBlock = relay.createAutoLayout('VERTICAL', { itemSpacing: 6 })
  wrap.appendChild(titleBlock)
  titleBlock.layoutSizingHorizontal = 'FILL'
  titleBlock.fills = []                            // 透明 ⚠
  appendText(titleBlock, titleChars, true)         // H1 思路 N
  appendText(titleBlock, descChars,  false)        // body 推荐理由

  // 3. cards_block (VERTICAL, itemSpacing=10)：多商品卡
  const cardsBlock = relay.createAutoLayout('VERTICAL', { itemSpacing: 10 })
  wrap.appendChild(cardsBlock)
  cardsBlock.layoutSizingHorizontal = 'FILL'
  cardsBlock.fills = []                            // 透明 ⚠
  for (const cardData of cards) {
    const card = makeCard(cardData)                // 调 §4.3 商品横卡 makeCard
    cardsBlock.appendChild(card)
    card.layoutSizingHorizontal = 'FILL'
  }
  return wrap
}

makeSection({ parent: ROOT, titleChars: '思路一 ...', descChars: '...', cards: [...] })
makeSection({ parent: ROOT, titleChars: '思路二 ...', descChars: '...', cards: [...] })
```

⚠ **新会话最常踩的坑**：
- root.padding 没设 → 等于 0 → 文本贴边
- 所有节点平铺到 root → 间距全部塌成 root.itemSpacing=10（Relay 默认）
- intro 区域也用 title_block 包（错）：顶部介绍的 H1+body 必须**直接挂 root**，间距用 root.itemSpacing=13；**只有 section_wrapper 内部**的 title_block 才用 itemSpacing=6
- section_wrapper / title_block / cards_block 等所有 wrapper 都必须 `fills = []`（默认白色会盖父背景）

### 4.3 商品横卡骨架

```
cardWrap        HORIZONTAL | F5F6FA | r12 | p8 | gap:12
├── imgFrame    FRAME | 86×86 FIXED | D8D9DE | r8 | clipsContent
│   └── collectWrap   FRAME | p:3 | rgba(0,0,0,0.16) | r4 | blur4 | absolute top:4 left:4
│       └── collectIcon   10×10 | SVG 占位矩形
└── bodyFrame   VERTICAL | FILL×86 FIXED | pt4 | SPACE_BETWEEN
    ├── titleArea   VERTICAL | FILL | HUG | gap:5
    │   ├── titleRow1   HORIZONTAL | FILL | HUG | gap:4 | counter:CENTER
    │   │   ├── ziyingTag   HORIZONTAL | HUG | p:2 3 | r2 | #FF0F23 | clip | primary:MIN
    │   │   │   └── "自营"  10px Semibold white | lineHeight:9
    │   │   └── nameRow1    14px Medium #171A26 lineHeight:14 | FILL | maxLines:1 | truncation:ENDING
    │   └── nameRow2    14px Medium #171A26 lineHeight:14 | FILL
    └── bottomFrame VERTICAL | FILL | HUG | gap:6
        ├── promoRow    HORIZONTAL | HUG | gap:4
        │   └── promoTag×N   HORIZONTAL | HUG | p:2 3 | r2 | clip | stroke 0.33 inside 30% | primary:MIN
        │       └── tagText  10px Regular | lineHeight:9
        └── priceAction HORIZONTAL | FILL | HUG | SPACE_BETWEEN | CENTER
            ├── priceGrp    HORIZONTAL | HUG | gap:8 | counter:FLEX_END
            │   ├── priceNumWrap   HORIZONTAL | HUG | counter:FLEX_END
            │   │   ├── symText   "¥"   12px Semibold #FF0F23 lineHeight:14
            │   │   └── numText   "215" 16px Semibold #FF0F23 lineHeight:14
            │   └── soldText  12px Regular #828794 lineHeight:12
            └── splitBtn    HORIZONTAL | HUG | counter:CENTER | gap:0
                ├── addBtn   FRAME | 24×20 FIXED | white | r-tl:6 r-bl:6
                │   └── iconCircle  FRAME | 24×24 | transparent | r:24 | absolute x:0 y:-2
                │       └── cartIcon  SVG 14.4×14.4 | absolute x:4.8 y:4.8
                └── buyBtn   FRAME | HUG×20 FIXED | px:8 py:6 | #FF0F23 | r-tr:6 r-br:6 | clip
                    └── buyText   "购买" 12px Medium white | lineHeight:12
```

**透明 Frame 必清单**（必须显式 `fills = []`，否则默认填白色盖掉父背景）：
`bodyFrame` / `titleArea` / `titleRow1` / `bottomFrame` / `promoRow` / `priceAction` / `priceGrp` / `priceNumWrap` / `splitBtn` / 主容器以外的所有 section 容器（如 `sec`、`txtBlk`、`cards`）

### 4.4 商品竖卡骨架（待补）

> 当前工作流尚未在 Relay 实现竖卡。首个竖卡方案落地后在此补全 2 列 / 3 列骨架。可参考横卡的 sizing 规则。

---

## §5 SVG 与图标

### 5.1 矩形占位（图片底色 / 标签占位）

```javascript
const rect = relay.createRectangle()
rect.resize(86, 86)
rect.fills = [{ type: 'SOLID', color: { r:0.847, g:0.851, b:0.871 } }]  // D8D9DE
rect.cornerRadius = 8
parent.appendChild(rect)
```

### 5.2 真实 SVG 导入（购物车图标）

```javascript
const svgString = `<svg ...>...</svg>`           // 读自 assets/购物车.svg
const cartIcon = relay.createNodeFromSvg(svgString)
cartIcon.resize(14.4, 14.4)
cartIcon.x = 4.8
cartIcon.y = 4.8
parent.appendChild(cartIcon)
```

### 5.3 SVG 资源全表

| 文件 | 尺寸 | Relay 用法 |
|---|---|---|
| `assets/购物车.svg` | 14.4×14 | Relay 直接 `createNodeFromSvg`（addBtn 内图标） |
| `assets/收藏.svg` | 16×16 | Relay 暂用 10×10 矩形占位；HTML 备份用 16×16 |
| `assets/自营标签.svg` | 26×14 | HTML 备份；Relay 改用纯 Frame+Text 实现 |
| `assets/促销标.svg` | 56×14 | HTML 备份；Relay 改用纯 Frame+Text |
| `assets/服务标签1.svg` | 42×14 | HTML 备份；Relay 改用纯 Frame+Text |
| `assets/服务标签2.svg` | 46×14 | HTML 备份；Relay 改用纯 Frame+Text |
| `assets/加购 & 购买按钮.svg` | 65×24 | HTML 备份；Relay 已拆为分体两节点（addBtn + buyBtn） |

> Relay 写入时：标签类节点（自营 / 满减 / 价保 / 退款）改为纯 Frame + Text 实现，不导 SVG；只有购物车图标需 `createNodeFromSvg`。

---

## §6 写入前 checklist

每次脚本提交前过一遍：

**通用**
- [ ] 脚本顶部已 `setCurrentPageAsync` + `loadFontAsync` ×3
- [ ] **`fills` / `strokes` / `name` / `width` 一律在 `appendChild` 之后单独赋值，不要塞进 `createAutoLayout` props**（§1.5）
- [ ] 顶层节点已用 `nextTopLevelOrigin()` 找空位，未堆在 (0,0)（§1.6）
- [ ] 顶层节点用 `resize(W, H)` 设固定宽，然后重设 `primaryAxisSizingMode='AUTO'` / `counterAxisSizingMode='FIXED'`
- [ ] HUG 帧只设 `primaryAxisSizingMode='AUTO'`，不调 `resize()`
- [ ] HORIZONTAL 行未设 `counterAxisSizingMode='FIXED'`
- [ ] 单行截断文字按 FILL → textAutoResize → maxLines → truncation 顺序

**root 必带属性（绝对不要省 / 不要用默认值）**
- [ ] `padding`：16/16/16/16（缺失→文本贴边，整稿局促）
- [ ] `itemSpacing`：13（Relay 默认 10，会让间距全塌）
- [ ] `fills`：WHITE（默认透明，对话稿应有白底）
- [ ] `width`：375（顶层 resize 设固定宽）

**页面骨架（模式 C 必读）**
- [ ] 顶部介绍 H1+body **直接挂 root**（不要包 wrapper）—— 间距用 root.itemSpacing=13
- [ ] 每个「思路 N + 卡片组」**单独包一个 section_wrapper**（itemSpacing=3）
- [ ] section_wrapper 内：title_block（itemSpacing=6）+ cards_block（itemSpacing=10）
- [ ] 所有 wrapper Frame（section_wrapper / title_block / cards_block / intro_block）都设 `fills = []`
- [ ] 严禁把所有节点平铺到 root 上 —— 那样间距全部塌陷成 root 默认值

**透明 Frame 必清 fills**（默认填白色会盖父背景）
- 页面骨架：`section_wrapper` / `title_block` / `intro_block` / `cards_block`
- 商品横卡内：`bodyFrame` / `titleArea` / `titleRow1` / `bottomFrame` / `promoRow` / `priceAction` / `priceGrp` / `priceNumWrap` / `splitBtn`

**商品横卡专项**
- [ ] 自营 / 促销 / 服务标签：`clipsContent=true`、文字 `lineHeight=9`、`primaryAxisAlignItems='MIN'`
- [ ] `nameRow1` 设 `maxLines=1` + `textTruncation='ENDING'`（防止折行撑高 titleArea → SPACE_BETWEEN 错位）
- [ ] ¥ 与数字底对齐：`priceNumWrap` 设 `counterAxisAlignItems='MAX'`
- [ ] `addBtn` 内 `iconCircle`：transparent、`absolute x:0 y:-2`、SVG 14.4×14.4 @ (4.8, 4.8)
- [ ] `buyBtn`：`clipsContent=true`、高度固定 20、padding 6/8
- [ ] `splitBtn`：`itemSpacing=0`、addBtn + buyBtn 紧贴
- [ ] 收藏 wrapper：`absolute top:4 left:4`、`padding:3`、`backdrop_blur:4`

**收尾**
- [ ] 写入完成调用 `get_screenshot` 验证视觉
- [ ] 节点不存在报错先用 `get_design_metadata` 确认 ID
