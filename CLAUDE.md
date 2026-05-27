# AI 对话导购助手 · 设计方案生成工作流

## 项目说明

本项目用于快速生成 JD AI 购物助手的回复设计方案。设计师描述场景，agent 按规范输出可在浏览器预览的 HTML 方案文件。

---

## 快速开始

用户说「生成一个 XX 场景的方案」时，执行以下步骤：

1. 读取 `design/ai-reply-design.md`，了解完整规范
2. 根据场景选择合适的组合模式（见下方「组合范式」）
3. **只生成 1 个 HTML 文件**，放在 `schemes/[场景名]/scheme-a.html`
4. 用预览服务器验证效果：`npx serve -p 7788 .`（配置已在 `.claude/launch.json`）

---

## 文件结构

```
对话流markdown/
├── CLAUDE.md                    ← 本文件
├── design/
│   └── ai-reply-design.md       ← 完整设计规范（必读）
├── assets/                      ← SVG 切图资源
│   ├── 收藏.svg                  16×16
│   ├── 加购 & 购买按钮.svg        65×24（split button）
│   ├── 自营标签.svg               26×14（备用，现用纯 CSS）
│   ├── 促销标.svg                 56×14（备用，现用纯 CSS）
│   ├── 服务标签1.svg              42×14（备用，现用纯 CSS）
│   └── 服务标签2.svg              46×14（备用，现用纯 CSS）
└── schemes/
    └── [场景名]/
        └── scheme-a.html
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
display: flex; flex-direction: column; justify-content: space-between;
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
.h-price-action { display: flex; align-items: center; justify-content: space-between; }
.h-price { display: flex; align-items: baseline; gap: 8px; }
/* ¥ 和数字 gap: 0，两者用 baseline 对齐 */
.price { display: flex; align-items: baseline; gap: 0; }
.price-sym { font-size: 12px; font-weight: 600; line-height: 14px; color: #FF0F23; }
.price-num { font-size: 16px; font-weight: 600; line-height: 14px; color: #FF0F23; }
.sold { font-size: 12px; font-weight: 400; line-height: 12px; color: #828794; }
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

## 注意事项

- **每次只生成 1 个方案**，文件名固定 `scheme-a.html`（用户确认后再做 B/C）
- **SVG 资源**：只有 `收藏.svg` 和 `加购 & 购买按钮.svg` 需要 `<img>` 引用；自营、促销、服务标签一律纯 CSS 实现
- **标题**：`tag-zying` 用 `float: left; margin-right: 4px; margin-top: 3px`，商品名用块级 `.h-name`（`word-break: break-word; line-height: 19px`）。行1文字绕 float（199px），行2回到左对齐（229px 全宽），`h-top` 用 `max-height: 38px; overflow: hidden` 限制两行
- **垂直居中**：所有 badge/tag 必须加 `display: inline-flex; align-items: center`，不依赖 line-height 居中
- **价格**：¥ 与数字 `gap: 0`，父容器 `align-items: baseline`
- HTML 文件完全自包含（inline CSS），浏览器直接打开可预览
