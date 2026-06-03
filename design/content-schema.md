---
version: "2.0"
scope: "对话流方案内容 Schema —— LLM 与确定性渲染器之间的契约（框架驱动）"
related:
  assembly: "design/assembly-spec.md"
  renderer: "render/render-scheme.js"
last_updated: "2026-06-02"
---

# 内容 Schema（scheme.json）

> **这是 LLM 与渲染器之间的唯一契约。** LLM 只产出符合本 schema 的对象；
> 由 [render/render-scheme.js](../render/render-scheme.js) 用设计师维护的组件库确定性装配。
> **LLM 不写任何 Relay 布局 API、不写间距/坐标/颜色。**

顶层用 `framework` 选框架（商品推荐 3 种 + 意图收集 1 种），各框架的结构/间距由渲染器按 [assembly-spec.md](./assembly-spec.md) 处理。

```json
{ "framework": "sections_h | grid_v | r_grid | intent_collect", "title": "场景名", ... }
```

---

## §1 framework: `sections_h`（横卡分组推荐）

按思路分段，每段 = 标题(+更多) + 推荐理由 + 若干横卡。最常用。

```json
{
  "framework": "sections_h",
  "title": "扫地机器人推荐",
  "intro": "按预算给你两组思路。",
  "sections": [
    { "h1": "思路一 · 高性价比", "more": true, "body": "预算有限优先看这些。",
      "cards": [ /* card_h，见 §5.1 */ ] },
    { "h1": "思路二 · 全能旗舰", "more": true, "body": "追求体验选自动集尘。",
      "cards": [ /* … */ ] }
  ]
}
```

| 字段 | 说明 |
|---|---|
| `intro` | 开场正文（可选） |
| `sections[]` | 每段：`h1`(必)、`more`(bool)、`body`(可选)、`cards`(card_h 数组，1-N 张) |

---

## §2 framework: `grid_v`（竖卡 2 列网格）

一个标题 + 介绍 + 一屏竖卡网格（行优先填 2 列）。适合同类商品快速浏览。

```json
{
  "framework": "grid_v",
  "title": "奶粉推荐",
  "h1": "热门推荐", "more": true,
  "body": "按口碑精选 6 款。",
  "cards": [ /* card_v，见 §5.2；通常 4 或 6 张（偶数排满）*/ ]
}
```

---

## §3 framework: `r_grid`（R 网格配思路文案）

思路总结标题 + 文案 + R_cardScheme（固定 3×2=6 张网格，仅价格可变）+ 收尾文案。

```json
{
  "framework": "r_grid",
  "title": "挑选连衣裙",
  "h1": "连衣裙挑选思路",
  "body": "按通勤/度假/礼服三类各选两款……",
  "prices": ["299", "199", "459", "258", "389", "169"],
  "footer": "面料优先桑蚕丝或天丝。"
}
```

| 字段 | 说明 |
|---|---|
| `prices[]` | 6 个价格（纯数字），按网格 6 张卡顺序填 |
| `footer` | 网格后的收尾正文（可选） |

> R_cardScheme 目前只有「价格」可变（图片/标题等是组件固定占位）。

---

## §4 framework: `intent_collect`（意图收集问卷）

开场 + N 道选择题（每题一张筛选卡），**仅最后一题显示「开始推荐吧」按钮**。

```json
{
  "framework": "intent_collect",
  "title": "挑选笔记本",
  "intro": "告诉我你的偏好，帮你精准匹配。",
  "questions": [
    { "title": "你主要用来做什么？",
      "options": [ {"text":"日常通勤","selected":true}, {"text":"商务办公"}, {"text":"游戏娱乐"} ] },
    { "title": "预算大概多少？",
      "options": [ {"text":"5000以下"}, {"text":"5000-8000","selected":true}, {"text":"8000以上"} ] }
  ]
}
```

| 字段 | 说明 |
|---|---|
| `questions[]` | 每题：`title`(问题) + `options[]` |
| `options[]` | 每项：`text`(选项文字)、`selected`(bool,高亮)、`desc`(可选描述) |

> 每题选项数建议 3 个（组件 3 槽位）。一题随机/按意图选中 1 项即可。

---

## §5 商品卡字段

### 5.1 card_h（横卡，用于 sections_h）

| 字段 | 必填 | 说明 |
|---|---|---|
| `name1` | ✓ | 商品名第一行（组件内单行截断） |
| `name2` | — | 第二行/规格；空则隐藏该行 |
| `price` | ✓ | **纯数字不带 ¥**、两侧不加空格 |
| `sold` | — | 销量，如"已售5万+"；空则隐藏 |
| `ziying` | — | 是否显示「自营」 |
| `promo` | — | 促销标（满减类）文字；空则隐藏 |
| `services` | — | 服务标数组（价保/退款类），**≤2 个** |

### 5.2 card_v（竖卡，用于 grid_v）

同 card_h，但商品名字段是 **`name`**（单字段，非 name1/name2），且多一个可选 `shop`（店铺名）。`price` 同样**纯数字**（渲染器 stripYen 兜底）。

---

## §6 LLM 产出 checklist

- [ ] 顶层有 `framework` 和 `title`
- [ ] `price` 纯数字不带 ¥、数字两侧不加空格
- [ ] 单卡 `services` ≤ 2；intent 每题 `options` ≈ 3
- [ ] 选填字段（name2/sold/ziying/promo/services/shop）不需要就**不写**，渲染器自动隐藏
- [ ] **不写任何间距/坐标/颜色** —— 由渲染器按框架确定性处理
