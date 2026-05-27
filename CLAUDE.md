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

**收藏图标叠加**（SVG 已含背景，wrapper 只加 blur）：
```html
<div class="h-collect">
  <img src="../../assets/收藏.svg" width="16" height="16">
</div>
```
```css
.h-collect {
  position: absolute; top: 4px; left: 4px;
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  border-radius: 4px; line-height: 0;
  /* 不加 background / padding，SVG 自带 */
}
```

### 内容区（右，flex:1）
```css
height: 86px; padding-top: 4px;
display: flex; flex-direction: column;
```

#### 上部分：标题区

tag `float: left`，商品名单字段自然绕排：
- 行1：文字在 tag 右侧（199px）
- 行2：tag 只有 14px 高，第二行（y≥19px）回到左边，与 tag 左对齐（229px 全宽）✓

```html
<div class="h-top">
  <span class="tag-zying">自营</span>
  <div class="h-name">商品名 规格 副标题（完整文字，自然换行）</div>
</div>
```
```css
/* overflow:hidden 包裹 float + 限高 2 行 */
.h-top { max-height: 38px; overflow: hidden; }

/* 自营 tag — float left，纯 CSS，不用 SVG */
.tag-zying {
  float: left;
  margin-right: 8px;
  margin-top: 3px;
  display: inline-flex; align-items: center;
  height: 14px; padding: 0 3px;
  background: #FF0F23; border-radius: 2px;
  color: white; font-size: 10px; font-weight: 600; line-height: 1;
  white-space: nowrap;
}

/* 商品名：块级，内联内容绕 float，整词换行，line-height 19px 含 5px 行距 */
.h-name {
  font-size: 14px; font-weight: 500; line-height: 19px; color: #171A26;
  word-break: break-word;
}
```

#### 下部分：促销 + 价格区（flex-col, gap: 6px）

**促销标签 — 纯 CSS（不用 SVG 文件）**：
```css
/* 满减标签（红色） */
.promo-jian {
  display: inline-flex; align-items: center; /* 垂直居中关键 */
  height: 14px; padding: 0 3px; border-radius: 2px;
  outline: 0.33px solid rgba(255,15,35,0.30); outline-offset: -0.33px;
  color: #FF0F23; font-size: 10px; font-weight: 400; line-height: 1;
  white-space: nowrap;
}
/* 服务标签（价保/退款，棕色） */
.promo-svc {
  display: inline-flex; align-items: center;
  height: 14px; padding: 0 3px; border-radius: 2px;
  outline: 0.33px solid rgba(181,105,26,0.30); outline-offset: -0.33px;
  color: #B5691A; font-size: 10px; font-weight: 400; line-height: 1;
  white-space: nowrap;
}
```

**价格 + 操作行**：
```html
<div class="h-price-action">
  <div class="h-price">
    <div class="price">
      <span class="price-sym">¥</span><span class="price-num">890</span>
    </div>
    <span class="sold">已售1万+</span>
  </div>
  <img src="../../assets/加购 & 购买按钮.svg" width="65" height="24">
</div>
```
```css
.h-price-action { display: flex; align-items: center; justify-content: space-between; height: 24px; }
.h-price { display: flex; align-items: baseline; gap: 8px; }
/* ¥ 和数字 gap: 0，两者用 baseline 对齐 */
.price { display: flex; align-items: baseline; gap: 0; }
.price-sym { font-size: 12px; font-weight: 600; line-height: 14px; color: #FF0F23; }
.price-num { font-size: 16px; font-weight: 600; line-height: 14px; color: #FF0F23; }
.sold { font-size: 12px; font-weight: 400; line-height: 12px; color: #828794; }
```

**h-body 与 h-bottom 布局**（标题↔promo 6px，promo↔价格 4px）：
```css
/* h-body：固定高度 86px，与图片等高；padding-top: 4px，无 padding-bottom */
.h-body {
  flex: 1; min-width: 0;
  height: 86px; padding-top: 4px;
  display: flex; flex-direction: column;
}
/* h-bottom：margin-top:6px 控制标题↔promo 间距；gap:4px 控制 promo↔价格间距 */
.h-bottom { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
```

---

## 组合范式

| 模式 | 适用场景 | 结构 |
|------|----------|------|
| A：文本 + 横卡列表 | 多商品快速浏览对比 | `text_block → card×N`，卡间距 10px |
| B：文本 + 三列竖卡 | 多商品快速视觉扫描 | `text_block → vertical_card_3col` |
| C：分段文本交替卡 | 每款有独立推荐理由 | `[H2+body] → card` 循环 |

**间距规则**：
- 文本块 ↔ 卡片块：**24px**
- 多横卡之间：**10px**
- 卡片内各区域：**6px**（下部分），**5px**（标题行间）

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
container.itemSpacing = 24           // 各区块间距
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
cardWrap  HORIZONTAL | F5F6FA | r12 | p8 | gap:12 | MIN/MIN
  imgRect   RECTANGLE | 86×86 FIXED | D8D9DE | r8
  bodyFrame VERTICAL  | FILL×86 FIXED | pt4 | SPACE_BETWEEN
    nameText  14px Medium | #171A26 | lineHeight:19 | FILL | HEIGHT
    bottomFrame VERTICAL | FILL | HUG | gap:4
      promoRow  HORIZONTAL | HUG | gap:4
        promoTag  HORIZONTAL | HUG | p:2 3 | r2 | stroke 0.33px inside 30%opacity
          tagText   10px Regular | HUG
      priceAction HORIZONTAL | FILL×24 FIXED | SPACE_BETWEEN | CENTER
        priceGrp  HORIZONTAL | HUG | gap:8 | BASELINE
          priceText  16px Semibold | #FF0F23 | HUG
          soldText   12px Regular  | #828794 | HUG
        buyBtn    FRAME | 65×24 FIXED | r4 | 橙色占位
```

### 关键 API 规则

- **FILL 必须在 `appendChild` 之后设置**，否则无效
- **`resize(w, h)` 会重置为 FIXED**，之后需重新 `layoutSizingHorizontal = 'FILL'`
- **页面切换**：每个脚本开头都要 `await relay.setCurrentPageAsync(page)`
- **颜色范围**：0-1（不是 0-255）
- **分批写入**：每批建议 ≤10 个节点，避免单次脚本过重

### 已知与 HTML 版本的差异

- **自营标签**：Relay 无 float 机制，暂用纯文字替代，按需手动补
- **¥ 字号**：HTML 版 ¥ 12px + 数字 16px；Relay 版合并为单节点 16px Semibold
- **购买按钮**：橙色矩形占位（65×24），需设计师替换为真实切图
- **收藏图标**：需额外脚本，按需添加

---

## 注意事项

- **每次只生成 1 个方案**，确认后再做变体
- 写入完成后必须调用 `get_screenshot` 截图验证
- 如遇节点不存在报错，先用 `get_design_metadata` 确认节点 ID
