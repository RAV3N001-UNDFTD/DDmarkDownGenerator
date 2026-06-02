---
version: "1.0"
scope: "对话流方案内容 Schema —— LLM 与确定性渲染器之间的契约"
related:
  assembly: "design/assembly-spec.md"
  renderer: "render/render-scheme.js"
source_board: "relay node 17:1747"
last_updated: "2026-06-01"
---

# 内容 Schema（scheme.json）

> **这是 LLM 与渲染器之间的唯一契约。** LLM 只产出符合本 schema 的 `scheme.json`；
> 之后由 [render/render-scheme.js](../render/render-scheme.js) 用设计师维护的组件库确定性装配。
> **LLM 不写任何 Relay 布局 API、不写间距/坐标/颜色。**

装配方式（区块如何堆叠、间距如何来）由渲染器按 [assembly-spec.md](./assembly-spec.md) 处理，schema 不涉及。

---

## §1 顶层结构

```json
{ "title": "场景名", "blocks": [ /* 按顺序渲染的区块 */ ] }
```

`blocks` 是一个**扁平的区块序列**（对齐画板 17:1747 的装配），按数组顺序从上到下渲染。每个区块由 `type` 区分。

---

## §2 区块类型

| `type` | 对应组件 | 字段 | 说明 |
|---|---|---|---|
| `header` | 按钮/加载完成 | 无 | 头部「搞定！快来看看吧」。通常放第一个，可省略 |
| `body` | 文本/正文 | `text` | 正文段落 |
| `h1` | 文本/一级标题 (+更多按钮) | `text`、`more`(bool) | 段落/思路标题；`more:true` 时右侧带「更多 >」 |
| `h2` | 文本/二级标题 | `text` | 次级标题 |
| `card` | 商品卡/P_card_h | 见 §3 | 商品横卡 |
| `all_products` | 按钮/全部商品按钮 | 无 | 底部「全部商品 >」入口。通常放最后，可省略 |
| `row_v` | 商品卡 / P_card_v ×1-2 | `cards` | 竖卡 2 列，1-2 张横排；见 §4 |

```json
{ "type": "header" }
{ "type": "body", "text": "干皮换季容易紧绷，下面按肤质给你两个思路。" }
{ "type": "h1", "text": "思路一 · 清爽款", "more": true }
{ "type": "h2", "text": "适合混油皮" }
{ "type": "all_products" }
```

---

## §3 card 区块（product_card_h）

```json
{
  "type": "card",
  "name1": "某品牌 玻尿酸保湿面霜 50g",
  "name2": "清爽型 · 适合混油皮",
  "price": "129",
  "sold": "已售2万+",
  "ziying": true,
  "promo": "满200减20",
  "services": ["7天价保", "闪电退款"]
}
```

| 字段 | 类型 | 必填 | 映射 | 说明 |
|---|---|---|---|---|
| `name1` | string | ✓ | 商品标题1 | 第一行（组件内截断） |
| `name2` | string | — | 商品标题2 | 第二行/规格；空则该行隐藏 |
| `price` | string | ✓ | 价格数字 | **纯数字不带 ¥**、两侧不加空格："129" ✓ |
| `sold` | string | — | 销量文案 | 空则隐藏。"已售2万+" ✓ / "已售 2 万+" ✗ |
| `ziying` | boolean | — | 自营标显示 | true 显示左上「自营」（文字固定） |
| `promo` | string | — | 促销标签×1 | 满减类，红色槽位；空则隐藏 |
| `services` | string[] | — | 服务标签×2 | 价保/退款类，棕色；**最多 2 个**，多余截断 |

> 标签槽位固定：1 个促销（红）+ 2 个服务（棕）。`promo` 对应促销槽，`services` 对应 2 个服务槽。不需要的标签**不写或留空**，渲染器自动隐藏并回收空位。

---

## §4 row_v 块（product_card_v 竖卡 2 列）

1-2 张竖卡横排（卡宽 168px，2 张刚好填满 343 内容区，间距由渲染器烘焙）。

```json
{
  "type": "row_v",
  "cards": [
    { "name": "飞鹤迹萃3段 12-36", "price": "215",
      "sold": "销量500+", "ziying": true,
      "promo": "满200减20", "services": ["7天价保"],
      "shop": "飞鹤京东自营旗舰店" },
    { "name": "某品牌 有机配方奶 400g", "price": "189",
      "sold": "销量3千+", "ziying": false,
      "services": ["闪电退款"] }
  ]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | string | 商品标题（单行截断） |
| `price` | string | **纯数字不带 ¥**（¥ 由组件自带，渲染器 stripYen 兜底） |
| `sold` | string | 销量文案；空则隐藏 |
| `ziying` | bool | 自营标 |
| `promo` | string | 促销标签；空则隐藏 |
| `services` | string[] | 服务标签，**最多 2 个** |
| `shop` | string | 店铺名；空则隐藏 |

---

## §5 完整示例（端到端验证用）

```json
{
  "title": "保湿面霜推荐",
  "blocks": [
    { "type": "header" },
    { "type": "body", "text": "干皮换季容易紧绷，下面按肤质给你两个思路。" },

    { "type": "h1", "text": "思路一 · 大油田也能用的清爽款", "more": true },
    { "type": "body", "text": "质地轻薄不闷痘，主打玻尿酸补水。" },
    { "type": "card", "name1": "某品牌 玻尿酸保湿面霜 50g", "name2": "清爽型 · 适合混油皮",
      "price": "129", "sold": "已售2万+", "ziying": true,
      "promo": "满200减20", "services": ["7天价保"] },
    { "type": "card", "name1": "某品牌 清爽控油凝露 80g",
      "price": "99", "sold": "已售5千+", "ziying": false,
      "services": ["闪电退款"] },

    { "type": "h1", "text": "思路二 · 干敏皮的厚润修护款", "more": true },
    { "type": "body", "text": "含神经酰胺，主打修护屏障。" },
    { "type": "card", "name1": "某品牌 神经酰胺修护面霜 50ml", "name2": "滋润型 · 适合干敏皮",
      "price": "215", "sold": "已售1万+", "ziying": true,
      "promo": "满300减40", "services": ["7天价保", "闪电退款"] },
    { "type": "card", "name1": "某品牌 高保湿乳霜 50g", "price": "89", "ziying": true },

    { "type": "all_products" }
  ]
}
```

---

## §5 LLM 产出 checklist

- [ ] 顶层有 `title` 和 `blocks`（扁平序列）
- [ ] 段落/思路标题用 `h1`；次级用 `h2`；正文用 `body`
- [ ] `price` 纯数字不带 ¥、数字两侧不加空格
- [ ] 单卡 `services` ≤ 2（多了截断）
- [ ] 选填字段（name2/sold/ziying/promo/services）不需要就**不写**，渲染器自动隐藏
- [ ] **不写任何间距/坐标/颜色** —— 由渲染器确定性处理
