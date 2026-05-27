# AI 对话导购助手 · 设计方案生成工作流

## 项目说明

本项目用于快速生成 JD AI 购物助手的回复设计方案。设计师描述场景，agent 通过 **zero-design MCP（`use_design_script`）直接写入 Relay**，无需生成 HTML 中间文件。

---

## 快速开始

用户说「生成一个 XX 场景的方案」时，执行以下步骤：

1. 确认目标 Relay 节点链接（用户提供，或沿用上次链接）
2. 根据场景选择合适的组合模式（见下方「组合范式」）
3. 通过 `use_design_script` **分批写入 Relay**（每批建议 ≤10 个节点操作）
4. 写完后调用 `get_screenshot` 截图确认效果

> 如需 HTML 预览备份，可另存 `schemes/[场景名]/scheme-a.html`，但**不作为默认输出**。

---

## 默认 Relay 目标

- **文件 fileKey**：`2059170750769684481`
- **页面 pageId**：`0:2`
- 每次写入前先切换页面：`await relay.setCurrentPageAsync(relay.root.children.find(p => p.id === '0:2'))`

---

## 文件结构

```
对话流markdown/
├── CLAUDE.md                    ← 本文件
├── design/
│   └── ai-reply-design.md       ← 完整设计规范（必读）
├── assets/                      ← SVG 切图资源（HTML 备份用）
│   ├── 收藏.svg                  16×16
│   ├── 加购 & 购买按钮.svg        65×24（split button）
│   └── ...
└── schemes/                     ← HTML 备份（可选，非默认）
    └── [场景名]/scheme-a.html
```

---

## 页面基础

- 页面宽度：**375px**，左右各 16px 边距，内容有效宽度 **343px**
- 外层 body 背景：`#EDEDED`
- 内容区背景：`#FFFFFF`，`padding: 16px`
- 字体：`"PingFang SC", -apple-system, "Helvetica Neue", sans-serif`

---

## Markdown 文本规范

| 类型 | 字号 | 字重 | 行高 | 颜色 |
|------|------|------|------|------|
| H1 | 16px | 600 | 28px | #171A26 |
| H2 | 14px | 600 | 24px | #171A26 |
| 正文段落 | 14px | 400 | 24px | #3D414D |

---

## 商品横卡实现规范

### 外层容器
```css
background: #F5F6FA; border-radius: 12px; padding: 8px;
display: flex; gap: 12px; align-items: flex-start;
```

### 图片区（左）
```css
width: 86px; height: 86px; flex-shrink: 0;
border-radius: 8px; background: #D8D9DE; /* 占位色 */
position: relative; overflow: hidden;
```

**收藏图标叠加**（wrapper 带半透明暗色背景 + padding + blur；icon 10×10）：
```html
<div class="h-collect">
  <img src="../../assets/收藏.svg" width="10" height="10">
</div>
```
```css
.h-collect {
  position: absolute; top: 4px; left: 4px;
  padding: 3px;
  background: rgba(0, 0, 0, 0.16);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  border-radius: 4px; line-height: 0;
}
```

### 内容区（右，flex:1）
```css
height: 86px; padding-top: 4px;
display: flex; flex-direction: column;
```

#### 上部分：标题区

标题区为**两行独立排列**（VERTICAL，gap:5），不使用 float：
- **行1**（HORIZONTAL，gap:4，center）：自营 tag + 商品名第一行（flex:1）
- **行2**：商品名第二行 / 规格副标题（全宽）

```html
<div class="h-title">
  <div class="h-title-row1">
    <span class="tag-zying">自营</span>
    <span class="h-name1">商品名第一行</span>
  </div>
  <div class="h-name2">商品名第二行（副标题 / 规格）</div>
</div>
```
```css
.h-title { display: flex; flex-direction: column; gap: 5px; }

.h-title-row1 { display: flex; align-items: center; gap: 4px; }

/* 自营 tag */
.tag-zying {
  flex-shrink: 0;
  display: inline-flex; justify-content: flex-start; align-items: center;
  height: 14px; padding: 2px 3px;
  background: #FF0F23; border-radius: 2px; overflow: hidden;
  color: white; font-size: 10px; font-weight: 600; line-height: 9px;
  white-space: nowrap;
}

/* 商品名两行：14px Medium，line-height 14px */
.h-name1 { flex: 1; font-size: 14px; font-weight: 500; line-height: 14px; color: #171A26; }
.h-name2 { width: 100%; font-size: 14px; font-weight: 500; line-height: 14px; color: #171A26; }
```

#### 下部分：促销 + 价格区（flex-col, gap: 6px）

**促销标签 — 纯 CSS（不用 SVG 文件）**：
```css
/* 满减标签（红色） */
.promo-jian {
  display: inline-flex; justify-content: flex-start; align-items: center;
  height: 14px; padding: 2px 3px; border-radius: 2px; overflow: hidden;
  outline: 0.33px solid rgba(255,15,35,0.30); outline-offset: -0.33px;
  color: #FF0F23; font-size: 10px; font-weight: 400; line-height: 9px;
  white-space: nowrap;
}
/* 服务标签（价保/退款，棕色） */
.promo-svc {
  display: inline-flex; justify-content: flex-start; align-items: center;
  height: 14px; padding: 2px 3px; border-radius: 2px; overflow: hidden;
  outline: 0.33px solid rgba(181,105,26,0.30); outline-offset: -0.33px;
  color: #B5691A; font-size: 10px; font-weight: 400; line-height: 9px;
  white-space: nowrap;
}
```

**价格 + 操作行**（分体按钮，总高 20px）：
```html
<div class="h-price-action">
  <div class="h-price">
    <div class="price">
      <span class="price-sym">¥</span><span class="price-num">890</span>
    </div>
    <span class="sold">已售1万+</span>
  </div>
  <!-- 分体式按钮：左=加购（白），右=购买（红） -->
  <div class="btn-split">
    <div class="btn-add">
      <!-- 购物车图标：24×24 圆形容器（y:-2 溢出上方），内含 14.4×14.4 SVG 购物车 -->
      <div class="btn-add-circle">
        <img class="btn-add-icon" src="../../assets/加购图标.svg" width="14.4" height="14.4">
      </div>
    </div>
    <div class="btn-buy">购买</div>
  </div>
</div>
```
```css
.h-price-action { display: flex; align-items: center; justify-content: space-between; }
.h-price { display: flex; align-items: flex-end; gap: 8px; }
/* ¥ 和数字用 flex-end 底对齐 */
.price { display: flex; align-items: flex-end; gap: 0; }
.price-sym { font-size: 12px; font-weight: 600; line-height: 14px; color: #FF0F23; }
.price-num { font-size: 16px; font-weight: 600; line-height: 14px; color: #FF0F23; }
.sold { font-size: 12px; font-weight: 400; line-height: 12px; color: #828794; }

/* 分体按钮 */
.btn-split { display: flex; align-items: center; flex-shrink: 0; }
.btn-add {
  width: 24px; height: 20px; flex-shrink: 0;
  background: white; border-radius: 6px 0 0 6px;
  position: relative; overflow: visible;
}
/* 购物车圆形容器：24×24，绝对定位，向上偏移 2px 使图标视觉居中 */
.btn-add-circle {
  position: absolute; left: 0; top: -2px;
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.btn-add-icon { width: 14.4px; height: 14.4px; display: block; }
.btn-buy {
  height: 20px; padding: 6px 8px;
  background: #FF0F23; border-radius: 0 6px 6px 0;
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 12px; font-weight: 500; line-height: 12px;
  white-space: nowrap;
}
```

**h-body 与 h-bottom 布局**：
```css
/* h-body：固定高度 86px；padding-top: 4px */
.h-body {
  flex: 1; min-width: 0;
  height: 86px; padding-top: 4px;
  display: flex; flex-direction: column; justify-content: space-between;
}
/* h-bottom：gap:6px 控制 promoRow↔priceAction */
.h-bottom { display: flex; flex-direction: column; gap: 6px; }
```

---

## 组合范式

| 模式 | 适用场景 | 结构 |
|------|----------|------|
| A：文本 + 横卡列表 | 多商品快速浏览对比 | `text_block → card×N`，卡间距 10px |
| B：文本 + 三列竖卡 | 多商品快速视觉扫描 | `text_block → vertical_card_3col` |
| C：分段文本交替卡 | 每款有独立推荐理由 | `[H2+body] → card` 循环 |

**间距规则（研发实现值）**：

> 文字行高自带上下各约 6px 的视觉留白，以下为扣除行高贡献后的实际开发/Relay 写入值，而非视觉稿绝对间距。

| 位置 | 研发值 | 行高各端贡献 | 视觉感知 |
|------|--------|-------------|---------|
| 文本块 / COT 底部 margin | **13px** | +6px | ≈ 一级间距 24px |
| H2 标题 顶部 margin | **7px** | +6px | ≈ 一级间距 24px |
| 商品卡 顶部 margin | **3px** | +6px | 卡紧接正文 |
| 商品卡 底部 margin | **3px** | +6px | 卡与下方内容收尾 |
| 横卡之间 gap | **10px** | — | 多卡堆叠间距 |
| H2 → 正文 / 正文 → 正文 gap | **6px** | +5px×2 | ≈ 二级间距 16px |

---

## Relay 写入规范

### Design Tokens（颜色值 0-1 范围）

| 用途 | Hex | Relay color |
|------|-----|-------------|
| 主文字 | #171A26 | `{ r:0.0902, g:0.1020, b:0.1490 }` |
| 正文 | #3D414D | `{ r:0.2392, g:0.2549, b:0.3020 }` |
| 价格/促销红 | #FF0F23 | `{ r:1, g:0.059, b:0.137 }` |
| 服务标签棕 | #B5691A | `{ r:0.710, g:0.412, b:0.102 }` |
| 已售灰 | #828794 | `{ r:0.510, g:0.529, b:0.580 }` |
| 卡片背景 | #F5F6FA | `{ r:0.9608, g:0.9647, b:0.9804 }` |
| 图片占位 | #D8D9DE | `{ r:0.847, g:0.851, b:0.871 }` |
| 内容区背景 | #FFFFFF | `{ r:1, g:1, b:1 }` |

### 主容器（每次写入的根节点）

```javascript
container.layoutMode = 'VERTICAL'
container.paddingLeft = container.paddingRight = 16
container.paddingTop = container.paddingBottom = 16
container.itemSpacing = 13           // 文本块底部研发间距（视觉≈24px，含行高6px）
container.primaryAxisSizingMode = 'AUTO'   // 高度随内容增长
container.counterAxisSizingMode = 'FIXED'  // 宽度固定 375px
container.fills = [{ type: 'SOLID', color: { r:1, g:1, b:1 } }]
```

### 文字节点

```javascript
await relay.loadFontAsync({ family: 'PingFang SC', style: 'Semibold' })  // H1/H2
await relay.loadFontAsync({ family: 'PingFang SC', style: 'Regular' })   // 正文/促销
await relay.loadFontAsync({ family: 'PingFang SC', style: 'Medium' })    // 商品名

// 通用设置（FILL 必须在 appendChild 之后设置）
text.textAutoResize = 'HEIGHT'
container.appendChild(text)
text.layoutSizingHorizontal = 'FILL'
```

### 商品横卡节点结构

```
cardWrap    HORIZONTAL | F5F6FA | r12 | p8 | gap:12
  imgFrame  FRAME | 86×86 FIXED | D8D9DE | r8 | clipsContent
    collectWrap  FRAME | p:3 | bg:rgba(0,0,0,0.16) | r4 | backdrop-blur | absolute top:4 left:4
      collectIcon  10×10 | SVG 占位矩形
  bodyFrame   VERTICAL | FILL×86 FIXED | pt4 | SPACE_BETWEEN
    titleArea   VERTICAL | FILL | HUG | gap:5
      titleRow1   HORIZONTAL | FILL | HUG | gap:4 | counterAxis:CENTER
        ziyingTag   HORIZONTAL | HUG | p:2 3 | r2 | #FF0F23 | clipsContent | primaryAxis:MIN
          tagText     "自营" 10px Semibold white | lineHeight:9
        nameRow1    14px Medium | #171A26 | lineHeight:14 | FILL
      nameRow2    14px Medium | #171A26 | lineHeight:14 | FILL
    bottomFrame   VERTICAL | FILL | HUG | gap:6
      promoRow    HORIZONTAL | HUG | gap:4
        promoTag    HORIZONTAL | HUG | p:2 3 | r2 | clipsContent | stroke 0.33px inside 30%opacity | primaryAxis:MIN
          tagText     10px Regular | lineHeight:9
      priceAction   HORIZONTAL | FILL | HUG | SPACE_BETWEEN | CENTER
        priceGrp    HORIZONTAL | HUG | gap:8 | FLEX_END
          priceNumWrap  HORIZONTAL | HUG | FLEX_END
            symText   "¥" 12px Semibold | #FF0F23 | lineHeight:14
            numText   "215" 16px Semibold | #FF0F23 | lineHeight:14
          soldText    12px Regular | #828794 | lineHeight:12
        splitBtn    HORIZONTAL | HUG | CENTER
          addBtn    FRAME | 24×20 FIXED | white | r-tl:6 r-bl:6
            iconCircle  FRAME | 24×24 | transparent | r:24 | absolute x:0 y:-2
              cartIcon  RECT | 14.4×14.4 | absolute x:4.8 y:4.8 | SVG 占位
          buyBtn    FRAME | HUG×20 FIXED | px:8 py:6 | #FF0F23 | r-tr:6 r-br:6 | clipsContent
            buyText   "购买" 12px Medium/500 white | lineHeight:12
```

### 关键 API 规则

- **FILL 必须在 `appendChild` 之后设置**，否则无效
- **`resize(w, h)` 会将该节点的两个维度都重置为 FIXED**，因此：
  - 需要 FILL 的维度：在 `appendChild` 后设 `layoutSizingHorizontal/Vertical = 'FILL'`
  - 需要 HUG 的维度：在 `resize()` **之后**重新设 `primaryAxisSizingMode = 'AUTO'`
  - **最简做法：HUG 帧直接不调 `resize()`，只设 `primaryAxisSizingMode = 'AUTO'`**
- **页面切换**：每个脚本开头都要 `await relay.setCurrentPageAsync(page)`
- **颜色范围**：0-1（不是 0-255）
- **分批写入**：每批建议 ≤10 个节点，避免单次脚本过重

```javascript
// ✅ 正确模式：HUG 帧不调 resize()
const frame = relay.createFrame();
frame.layoutMode = 'VERTICAL';
frame.primaryAxisSizingMode = 'AUTO';   // HUG height
frame.counterAxisSizingMode = 'FIXED';  // width 由 FILL 覆盖
frame.itemSpacing = 6;
parent.appendChild(frame);
frame.layoutSizingHorizontal = 'FILL';  // FILL width

// ✅ 正确模式：需要固定尺寸时，resize() 之后再设 AUTO
const btn = relay.createFrame();
btn.resize(10, 20);                     // 先固定高度 20
btn.primaryAxisSizingMode = 'AUTO';     // 再设宽度 HUG（必须在 resize 之后）
btn.counterAxisSizingMode = 'FIXED';    // 高度维持 20px
```

### Relay 脚本实现说明

- **自营/促销/服务标签**：`clipsContent = true`；文字 lineHeight 设 9；`primaryAxisAlignItems = 'MIN'`
- **¥ 字号**：用两个文字节点（symText 12px + numText 16px）放入 `counterAxisAlignItems:'MAX'` 横向 Frame
- **收藏图标**：collectWrap 设 x/y 后自动 absolutePosition；icon 10×10 矩形占位
- **addBtn 购物车图标**：在 addBtn 内创建透明 24×24 圆形 Frame（y:-2），其内放 14.4×14.4 矩形占位（x:4.8, y:4.8）
- **buyBtn**：`clipsContent = true`，高度固定 20px，paddingTop/Bottom:6（内容被 clip 截齐）
- **splitBtn**：addBtn + buyBtn 并排，itemSpacing:0，无 gap
- **收藏图标**：需额外脚本，按需添加

---

## 注意事项

- **每次只生成 1 个方案**，确认后再做变体
- 写入完成后必须调用 `get_screenshot` 截图验证
- 如遇节点不存在报错，先用 `get_design_metadata` 确认节点 ID
