/**
 * render-scheme.js —— 对话流方案「确定性渲染器」（v4 · 框架驱动 + token 实时解析）
 * =================================================================
 * 冻结代码。LLM 只产出 content schema，不写任何 Relay 布局 API。
 *
 * 用法（在 use_design_script 里）：
 *   1) 读本文件全文（禁止凭记忆重建）→ 粘到脚本头部
 *   2) 末尾写：  return await renderScheme(SCHEME)
 *
 * SCHEME.framework 选择框架（见 assembly-spec.md §3 范式参考板）：
 *   - "sections_h"     横卡分组推荐（框架2 / 板 18:875）
 *   - "grid_v"         竖卡 2 列网格（框架1 / 板 18:860）
 *   - "r_grid"         R 网格配思路文案（框架3 / 板 18:936）
 *   - "intent_collect" 意图收集问卷（板 18:908，末张筛选卡才显示按钮）
 *   - 省略 framework → 走 blocks 扁平兜底（灵活拼）
 *
 * 防漂移：组件按【名字 token】实时解析（TOKENS），不硬编码 node ID。
 * 各框架间距按各自参考板测量（见每个 render* 顶部）。
 * =================================================================
 */

const TOKENS = {
  header: '加载完成', body: '正文', h1: '一级标题', h2: '二级标题',
  more_btn: '更多按钮', all_products: '全部商品按钮',
  product_card_h: 'P_card_h', product_card_v: 'P_card_v',
  filter_card: '筛选卡', r_card_scheme: 'R_cardScheme',
}
const COLOR = { WHITE: { r: 1, g: 1, b: 1 } }
const PAGE_WIDTH = 375

/* ───────────────────────── 顶层入口 ───────────────────────── */
async function renderScheme(scheme) {
  const warnings = []
  await setupPageAndFonts()
  buildCompCache()
  let root
  switch (scheme.framework) {
    case 'sections_h': root = renderSectionsH(scheme, warnings); break
    case 'grid_v': root = renderGridV(scheme, warnings); break
    case 'r_grid': root = renderRGrid(scheme, warnings); break
    case 'intent_collect': root = renderIntent(scheme, warnings); break
    default: root = renderBlocks(scheme, warnings)
  }
  try { relay.currentPage.selection = [root]; relay.viewport.scrollAndZoomIntoView([root]) } catch (e) {}
  return {
    ok: true, rootId: root.id, framework: scheme.framework || 'blocks',
    selfCheck: { w: root.width, padding: `${root.paddingTop}/${root.paddingRight}/${root.paddingBottom}/${root.paddingLeft}`, gap: root.itemSpacing },
    warnings,
  }
}

/* ═════════════════════ 框架2：横卡分组推荐（板 18:875，pad10/gap10）═══════════════════ */
function renderSectionsH(scheme, warnings) {
  const root = makeRoot(scheme.title, 10, 16, 10)
  appendInst(root, 'header', warnings)
  if (scheme.intro) appendText(root, 'body', scheme.intro, warnings)
  for (const sec of scheme.sections || []) {
    const box = mkW(root, 'VERTICAL'); box.itemSpacing = 10 // 段容器
    h1Row(box, sec.h1, sec.more, 0, warnings)
    if (sec.body) appendText(box, 'body', sec.body, warnings)
    for (const c of sec.cards || []) cardH(box, c, warnings)
  }
  return root
}

/* ═════════════════════ 框架1：竖卡 2 列网格（板 18:860，pad10/gap10）═══════════════════ */
function renderGridV(scheme, warnings) {
  const root = makeRoot(scheme.title, 10, 16, 10)
  appendInst(root, 'header', warnings)
  if (scheme.h1) h1Row(root, scheme.h1, scheme.more, 0, warnings)
  if (scheme.body) appendText(root, 'body', scheme.body, warnings)
  const cards = scheme.cards || []
  const grid = mkW(root, 'HORIZONTAL'); grid.itemSpacing = 10 // FILL 343
  const colL = mkW(grid, 'VERTICAL'); colL.itemSpacing = 10 // FILL 半宽（约 166.5）
  const colR = mkW(grid, 'VERTICAL'); colR.itemSpacing = 10
  cards.forEach((c, i) => cardV((i % 2 === 0 ? colL : colR), c, warnings)) // 行优先：偶左奇右；卡 FILL 半宽
  return root
}

/* ═════════════════════ 框架3：R 网格配思路文案（板 18:936，pad16/gap6+wrapper）══════════ */
function renderRGrid(scheme, warnings) {
  const root = makeRoot(scheme.title, 16, 16, 6)
  const hw = mkW(root, 'VERTICAL'); hw.paddingBottom = 13; appendInst(hw, 'header', warnings) // header wrapper
  if (scheme.h1) h1Row(root, scheme.h1, false, 9, warnings) // h1 wrapper 上 padding 9
  if (scheme.body) appendText(root, 'body', scheme.body, warnings)
  const rs = instOf('r_card_scheme', warnings)
  if (rs) {
    root.appendChild(rs); rs.layoutSizingHorizontal = 'FILL'
    const fcards = rs.findAll((n) => n.type === 'INSTANCE' && /F_card_[LS]/.test(n.mainComponent?.name || ''))
    const prices = scheme.prices || []
    for (let i = 0; i < Math.min(fcards.length, prices.length); i++) setProps(fcards[i], { 价格: stripYen(prices[i]) }, warnings)
  }
  if (scheme.footer) appendText(root, 'body', scheme.footer, warnings)
  return root
}

/* ═════════════════════ 意图收集：N 问筛选卡（板 18:908，pad10/gap10，末张才显示按钮）════════ */
function renderIntent(scheme, warnings) {
  const root = makeRoot(scheme.title, 10, 16, 10)
  appendInst(root, 'header', warnings)
  if (scheme.intro) appendText(root, 'body', scheme.intro, warnings)
  const qs = scheme.questions || []
  qs.forEach((q, qi) => {
    const card = instOf('filter_card', warnings); if (!card) return
    root.appendChild(card); card.layoutSizingHorizontal = 'FILL'
    const titleInst = card.findOne((n) => n.type === 'INSTANCE' && (n.mainComponent?.name || '').includes('一级标题'))
    if (titleInst && q.title) setProps(titleInst, { 内容: q.title }, warnings)
    const opts = card.findAll((n) => n.type === 'INSTANCE' && n.name === '筛选卡')
    ;(q.options || []).forEach((o, i) => {
      if (!opts[i]) return
      setProps(opts[i], { 属性1: o.selected ? '已选中' : '未选中', ...(o.text ? { 内容: o.text } : {}), ...(o.desc ? { 描述: o.desc, 展示描述: true } : {}) }, warnings)
    })
    if (qi < qs.length - 1) hideStartButton(card) // 仅最后一张显示「开始推荐吧」
  })
  return root
}

/* ═════════════════════ 兜底：扁平 blocks（灵活拼，pad10/gap10）═══════════════════ */
function renderBlocks(scheme, warnings) {
  const root = makeRoot(scheme.title, 10, 16, 10)
  for (const b of scheme.blocks || []) {
    switch (b.type) {
      case 'header': appendInst(root, 'header', warnings); break
      case 'body': appendText(root, 'body', b.text, warnings); break
      case 'h1': h1Row(root, b.text, b.more, 0, warnings); break
      case 'h2': appendText(root, 'h2', b.text, warnings); break
      case 'card': cardH(root, b, warnings); break
      case 'row_v': { const w = mkW(root, 'HORIZONTAL'); w.itemSpacing = 10; for (const c of (b.cards || []).slice(0, 2)) cardV(w, c, warnings); break }
      case 'all_products': appendInst(root, 'all_products', warnings); break
      default: warnings.push(`未知 block.type: ${b.type}`)
    }
  }
  return root
}

/* ═════════════════════ 区块级 helper ═══════════════════ */
// h1 行：[一级标题 + 可选 更多按钮]，SPACE_BETWEEN；padTop 给 r_grid 用
function h1Row(parent, text, more, padTop, warnings) {
  const wrap = mkW(parent, 'HORIZONTAL')
  if (padTop) wrap.paddingTop = padTop
  wrap.primaryAxisAlignItems = 'SPACE_BETWEEN'
  try { wrap.counterAxisAlignItems = 'BASELINE' } catch (e) { wrap.counterAxisAlignItems = 'CENTER' }
  wrap.itemSpacing = 12
  const t = instOf('h1', warnings)
  if (t) { wrap.appendChild(t); t.layoutSizingHorizontal = 'HUG'; setProps(t, { 内容: text }, warnings) }
  if (more) { const m = instOf('more_btn', warnings); if (m) { wrap.appendChild(m); m.layoutSizingHorizontal = 'HUG' } }
}

// 横卡（P_card_h）：直接入 parent
function cardH(parent, card, warnings) {
  const inst = instOf('product_card_h', warnings); if (!inst) return
  parent.appendChild(inst); inst.layoutSizingHorizontal = 'FILL'
  setProps(inst, {
    自营标显示: !!card.ziying,
    ...(card.name1 != null ? { 商品标题1: String(card.name1) } : {}),
    ...(card.price != null ? { 价格数字: stripYen(card.price) } : {}),
    ...(has(card.name2) ? { 商品标题2: String(card.name2) } : {}),
    ...(has(card.sold) ? { 销量文案: String(card.sold) } : {}),
  }, warnings)
  if (!has(card.name2)) hideByName(inst, '标题行2')
  if (!has(card.sold)) hideByName(inst, '置信字段')
  fillTags(inst, card, warnings)
}

// 竖卡（P_card_v）：fill=true 横排均分（row_v）；fill=false 保持 168 原宽（grid_v）
function cardV(parent, card, warnings, fill = true) {
  const inst = instOf('product_card_v', warnings); if (!inst) return
  parent.appendChild(inst); if (fill) inst.layoutSizingHorizontal = 'FILL'
  setProps(inst, {
    自营标显示: !!card.ziying,
    ...(card.name != null ? { 商品标题: String(card.name) } : {}),
    ...(card.price != null ? { 价格: stripYen(card.price) } : {}),
    ...(has(card.sold) ? { 销量文案: String(card.sold) } : {}),
    ...(has(card.shop) ? { 店铺名: String(card.shop) } : {}),
  }, warnings)
  if (!has(card.sold)) hideByName(inst, '销量500+')
  if (!has(card.shop)) hideByName(inst, 'Frame 2085663872')
  fillTags(inst, card, warnings)
}

// 嵌套标签（促销标×1 + 服务标×N），横/竖卡共用
function fillTags(inst, card, warnings) {
  const promos = inst.findAll((n) => n.type === 'INSTANCE' && n.name === '促销标')
  const services = inst.findAll((n) => n.type === 'INSTANCE' && n.name === '服务标')
  setTag(promos[0], card.promo, warnings)
  const svc = Array.isArray(card.services) ? card.services : []
  if (svc.length > services.length) warnings.push(`服务标 ${svc.length} > ${services.length} 槽位，截断`)
  services.forEach((node, i) => setTag(node, svc[i], warnings))
}
function setTag(node, text, warnings) {
  if (!node) return
  if (!has(text)) { node.visible = false; return }
  setProps(node, { 文本: String(text) }, warnings)
}

// 意图收集：隐藏某张筛选卡的「开始推荐吧」按钮容器（保留到最后一张才显示）
function hideStartButton(filterInst) {
  const t = filterInst.findOne((n) => n.type === 'TEXT' && n.characters === '开始推荐吧')
  if (!t) return
  let n = t
  while (n.parent && n.parent !== filterInst) n = n.parent
  if (n && n !== filterInst) n.visible = false
}

/* 实例化固定组件 / 文本组件 */
function appendInst(parent, logical, warnings) {
  const inst = instOf(logical, warnings); if (!inst) return null
  parent.appendChild(inst); inst.layoutSizingHorizontal = 'FILL'; return inst
}
function appendText(parent, logical, text, warnings) {
  const inst = appendInst(parent, logical, warnings); if (inst) setProps(inst, { 内容: text }, warnings); return inst
}

/* ═════════════════════ 基础设施 ═══════════════════ */
async function setupPageAndFonts() {
  const page = relay.root.children.find((p) => p.id === '0:2')
  if (page) await relay.setCurrentPageAsync(page)
  for (const style of ['Semibold', 'Medium', 'Regular']) {
    try { await relay.loadFontAsync({ family: 'PingFang SC', style }) } catch (e) {}
  }
}

let COMP_CACHE = null
function buildCompCache() {
  COMP_CACHE = relay.currentPage.findAll(
    (n) => (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') && !(n.parent && n.parent.type === 'COMPONENT_SET')
  )
}
function resolveComp(logical, warnings) {
  const token = TOKENS[logical]
  if (!token) { warnings.push(`未登记 token: ${logical}`); return null }
  const hits = (COMP_CACHE || []).filter((c) => c.name.includes(token))
  if (hits.length === 0) { warnings.push(`找不到组件 token「${token}」(${logical})——组件库可能改名`); return null }
  if (hits.length > 1) warnings.push(`token「${token}」匹配 ${hits.length} 个，取第一个`)
  return hits[0]
}
function instOf(logical, warnings) {
  const comp = resolveComp(logical, warnings)
  if (!comp) return null
  return comp.type === 'COMPONENT_SET' ? comp.defaultVariant.createInstance() : comp.createInstance()
}

function makeRoot(title, padV, padH, gap) {
  const { x, y } = nextTopLevelOrigin()
  const root = relay.createAutoLayout('VERTICAL')
  relay.currentPage.appendChild(root)
  root.set({ name: title || '对话流方案', paddingLeft: padH, paddingRight: padH, paddingTop: padV, paddingBottom: padV, itemSpacing: gap, fills: [{ type: 'SOLID', color: COLOR.WHITE }] })
  root.resize(PAGE_WIDTH, root.height)
  root.primaryAxisSizingMode = 'AUTO'
  root.counterAxisSizingMode = 'FIXED'
  root.x = x; root.y = y
  return root
}
function nextTopLevelOrigin(spacing = 80) {
  const tops = relay.currentPage.children.filter((n) => n.visible !== false && n.type !== 'SECTION')
  if (tops.length === 0) return { x: 0, y: 0 }
  return { x: Math.max(...tops.map((n) => n.x + n.width)) + spacing, y: Math.min(...tops.map((n) => n.y)) }
}

// 通用属性填充：{基础名: 值} → 按基础名匹配真实 key → setProperties
function setProps(inst, obj, warnings) {
  const km = baseMap(inst.mainComponent)
  const out = {}
  for (const [base, val] of Object.entries(obj)) {
    const k = km[base]
    if (k) out[k] = val
    else warnings.push(`${inst.name || '组件'} 缺属性「${base}」`)
  }
  if (Object.keys(out).length) inst.setProperties(out)
}
function mkW(parent, direction) {
  const w = relay.createAutoLayout(direction)
  parent.appendChild(w)
  w.layoutSizingHorizontal = 'FILL'
  w.fills = []
  return w
}
function hideByName(inst, name) { const n = inst.findOne((x) => x.name === name); if (n) n.visible = false }
function has(v) { return v != null && v !== '' }
function stripYen(v) { return String(v).replace(/^\s*¥\s*/, '') }

/* 基础名 → 真实 key。⚠ 读 mainComponent 的 componentPropertyDefinitions
 * （inst.componentProperties 在 setProperties 前为空，不可用）。 */
function baseMap(mc) {
  if (mc && mc.parent && mc.parent.type === 'COMPONENT_SET') mc = mc.parent
  const defs = (mc && mc.componentPropertyDefinitions) || {}
  const m = {}
  for (const k of Object.keys(defs)) m[k.replace(/#[^#]+$/, '')] = k
  return m
}
