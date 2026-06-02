/**
 * render-scheme.js —— 对话流方案「确定性渲染器」
 * =================================================================
 * 冻结代码：用设计师维护的本地组件库（component-registry.md）确定性装配。
 * LLM 只产出 content schema（content-schema.md），不写任何 Relay 布局 API。
 *
 * 用法（在 use_design_script 里）：
 *   1) 把本文件全文粘到脚本头部
 *   2) 末尾写：  return await renderScheme(SCHEME)
 *
 * 装配模型（画板 17:1747 为准）：内容堆叠 itemSpacing=6，
 * 每个区块的额外间距烘焙进各自 wrapper（见 component-registry.md §3）。
 * =================================================================
 */

/* ── 组件注册表：逻辑名 → 本地组件 node ID（与 component-registry.md §1 同步） ── */
const REGISTRY = {
  header: '17:2110', // 按钮/加载完成
  body: '17:1735', // 文本/正文        prop: 内容
  h1: '17:1728', // 文本/一级标题    prop: 内容
  h2: '17:1733', // 文本/二级标题    prop: 内容
  more_btn: '17:2100', // 按钮/更多按钮
  all_products: '17:1745', // 按钮/全部商品按钮
  product_card_h: '17:1693',  // 商品卡/P_card_h（横卡）
  product_card_v2: '18:79',   // 商品卡/P_card_v2（竖卡 2 列，168×274）
}

const COLOR = { WHITE: { r: 1, g: 1, b: 1 } }
const PAGE_WIDTH = 375
const STACK_GAP = 6 // 区块间统一间距
const CARD_SERVICE_SLOTS = 2 // P_card_h 内服务标签槽位数

/* ───────────────────────── 顶层入口 ───────────────────────── */
async function renderScheme(scheme) {
  const warnings = []
  await setupPageAndFonts()
  const root = buildRoot(scheme.title || '对话流方案')

  for (const block of scheme.blocks || []) {
    switch (block.type) {
      case 'header': await appendFixed(root, 'header', warnings); break
      case 'body': await appendTextBlock(root, 'body', block.text, warnings); break
      case 'h1': await appendH1(root, block, warnings); break
      case 'h2': await appendTextBlock(root, 'h2', block.text, warnings); break
      case 'card': await appendCard(root, block, warnings); break
      case 'all_products': await appendFixed(root, 'all_products', warnings); break
      case 'row_v2': await appendRowV2(root, block, warnings); break
      default: warnings.push(`未知 block.type: ${block.type}`)
    }
  }

  try { relay.currentPage.selection = [root]; relay.viewport.scrollAndZoomIntoView([root]) } catch (e) {}
  return {
    ok: true, rootId: root.id,
    selfCheck: { w: root.width, padding: `${root.paddingTop}/${root.paddingRight}/${root.paddingBottom}/${root.paddingLeft}`, itemSpacing: root.itemSpacing, hasFill: !!(root.fills && root.fills.length > 0) },
    warnings,
  }
}

/* ───────────────────────── 页面 & 字体 ───────────────────────── */
async function setupPageAndFonts() {
  const page = relay.root.children.find((p) => p.id === '0:2')
  if (page) await relay.setCurrentPageAsync(page)
  for (const style of ['Semibold', 'Medium', 'Regular']) {
    try { await relay.loadFontAsync({ family: 'PingFang SC', style }) } catch (e) {}
  }
}

/* ───────────────────────── 页面根 ───────────────────────── */
function buildRoot(title) {
  const { x, y } = nextTopLevelOrigin()
  const root = relay.createAutoLayout('VERTICAL')
  relay.currentPage.appendChild(root)
  root.set({
    name: title,
    paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16,
    itemSpacing: STACK_GAP,
    fills: [{ type: 'SOLID', color: COLOR.WHITE }],
  })
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

/* ───────────────────────── 区块装配 ───────────────────────── */

// 固定内容组件（header / all_products）：直接入堆叠
async function appendFixed(root, key, warnings) {
  const inst = await instOf(key, warnings); if (!inst) return
  if (key === 'header') {
    // header 包一层 wrapper，下 padding 13
    const wrap = makeWrapper(root, 'VERTICAL')
    wrap.paddingBottom = 13
    wrap.appendChild(inst); inst.layoutSizingHorizontal = 'FILL'
  } else {
    root.appendChild(inst); inst.layoutSizingHorizontal = 'FILL'
  }
}

// 文本组件（body / h2）：直接入堆叠，设「内容」
async function appendTextBlock(root, key, text, warnings) {
  const inst = await instOf(key, warnings); if (!inst) return
  root.appendChild(inst); inst.layoutSizingHorizontal = 'FILL'
  setTextProp(inst, '内容', text, warnings)
}

// h1 行：HORIZONTAL wrapper（上 padding 9，SPACE_BETWEEN）+ 一级标题 [+ 更多按钮]
async function appendH1(root, block, warnings) {
  const wrap = makeWrapper(root, 'HORIZONTAL')
  wrap.paddingTop = 9
  wrap.primaryAxisAlignItems = 'SPACE_BETWEEN'
  try { wrap.counterAxisAlignItems = 'BASELINE' } catch (e) { wrap.counterAxisAlignItems = 'CENTER' }
  wrap.itemSpacing = 12

  const title = await instOf('h1', warnings)
  if (title) { wrap.appendChild(title); title.layoutSizingHorizontal = 'HUG'; setTextProp(title, '内容', block.text, warnings) }
  if (block.more) {
    const more = await instOf('more_btn', warnings)
    if (more) { wrap.appendChild(more); more.layoutSizingHorizontal = 'HUG' }
  }
}

// card：VERTICAL wrapper（上下 padding 3）+ P_card_h 实例
async function appendCard(root, card, warnings) {
  const wrap = makeWrapper(root, 'VERTICAL')
  wrap.paddingTop = 3; wrap.paddingBottom = 3
  const inst = await instOf('product_card_h', warnings); if (!inst) return
  wrap.appendChild(inst); inst.layoutSizingHorizontal = 'FILL'
  applyCard(inst, card, warnings)
}

/* 透明 wrapper（fills=[]，FILL 宽，HUG 高） */
function makeWrapper(parent, direction) {
  const w = relay.createAutoLayout(direction)
  parent.appendChild(w)
  w.layoutSizingHorizontal = 'FILL'
  w.fills = []
  return w
}

/* ───────────────────────── 商品卡内容填充 ───────────────────────── */
function applyCard(inst, card, warnings) {
  const keyOf = baseMap(inst.mainComponent)
  const props = {}
  const put = (base, val) => { const k = keyOf[base]; if (k) props[k] = val; else warnings.push(`P_card_h 缺属性「${base}」`) }

  put('自营标显示', !!card.ziying)
  if (card.name1 != null) put('商品标题1', String(card.name1))
  if (card.price != null) put('价格数字', String(card.price))
  const hasName2 = card.name2 != null && card.name2 !== ''
  const hasSold = card.sold != null && card.sold !== ''
  if (hasName2) put('商品标题2', String(card.name2))
  if (hasSold) put('销量文案', String(card.sold))
  if (Object.keys(props).length) inst.setProperties(props)

  // 无值则隐藏对应文本节点
  if (!hasName2) hideByName(inst, '标题行2')
  if (!hasSold) hideByName(inst, '置信字段')

  // 嵌套标签：促销×1 + 服务×N
  const promos = inst.findAll((n) => n.type === 'INSTANCE' && n.name === '促销标签')
  const services = inst.findAll((n) => n.type === 'INSTANCE' && n.name === '服务标签')
  setTagInstance(promos[0], card.promo, warnings)
  const svc = Array.isArray(card.services) ? card.services : []
  if (svc.length > CARD_SERVICE_SLOTS) warnings.push(`服务标签 ${svc.length} 个 > ${CARD_SERVICE_SLOTS} 槽位，已截断`)
  services.forEach((node, i) => setTagInstance(node, svc[i], warnings))
}

function setTagInstance(node, text, warnings) {
  if (!node) return
  if (text == null || text === '') { node.visible = false; return }
  const k = baseMap(node.mainComponent)['文本']
  if (k) node.setProperties({ [k]: String(text) })
  else warnings.push('标签组件缺少「文本」属性')
}

/* ───────────────────────── 工具 ───────────────────────── */
async function instOf(key, warnings) {
  const id = REGISTRY[key]
  if (!id) { warnings.push(`未注册组件: ${key}`); return null }
  const comp = await relay.getNodeByIdAsync(id)
  if (!comp || (comp.type !== 'COMPONENT' && comp.type !== 'COMPONENT_SET')) { warnings.push(`node ${id} 不是组件(${comp && comp.type})`); return null }
  return comp.type === 'COMPONENT_SET' ? comp.defaultVariant.createInstance() : comp.createInstance()
}

function setTextProp(inst, baseName, value, warnings) {
  if (value == null) return
  const k = baseMap(inst.mainComponent)[baseName]
  if (k) inst.setProperties({ [k]: String(value) })
  else warnings.push(`${inst.name} 缺属性「${baseName}」`)
}

function hideByName(inst, name) {
  const n = inst.findOne((x) => x.name === name)
  if (n) n.visible = false
}

/* ───────────── row_v2：竖卡 2 列，HORIZONTAL 横排，间距 7 ───────────── */
async function appendRowV2(root, block, warnings) {
  const wrap = makeWrapper(root, 'HORIZONTAL')
  wrap.itemSpacing = 7
  for (const card of (block.cards || []).slice(0, 2)) {
    const inst = await instOf('product_card_v2', warnings)
    if (!inst) continue
    wrap.appendChild(inst)
    inst.layoutSizingHorizontal = 'FILL'
    applyProductCardV2(inst, card, warnings)
  }
}

/* P_card_v2：组件级属性（7 个）+ 嵌套实例标签（与 P_card_h 同模式）
 * 标签行内是 促销标签×1 + 服务标签×2 的嵌套实例，直接复用 setTagInstance */
function applyProductCardV2(inst, card, warnings) {
  const keyOf = baseMap(inst.mainComponent)
  const props = {}
  const put = (base, val) => { const k = keyOf[base]; if (k) props[k] = val; else warnings.push(`P_card_v2 缺属性「${base}」`) }

  put('自营标显示', !!card.ziying)
  if (card.name  != null) put('商品标题', String(card.name))
  if (card.price != null) put('价格',     String(card.price))

  const hasSold = card.sold != null && card.sold !== ''
  if (hasSold) put('销量文案', String(card.sold))

  const hasShop = card.shop != null && card.shop !== ''
  if (hasShop) put('店铺名', String(card.shop))

  if (Object.keys(props).length) inst.setProperties(props)

  // 无值时直接找节点 visible=false（不依赖 BOOLEAN 属性，更稳）
  if (!hasSold) hideByName(inst, '销量500+')
  if (!hasShop) hideByName(inst, 'Frame 2085663872')

  // 嵌套标签（促销×1 + 服务×2）—— 与 P_card_h 完全相同的 setTagInstance 模式
  const promos   = inst.findAll((n) => n.type === 'INSTANCE' && n.name === '促销标签')
  const services = inst.findAll((n) => n.type === 'INSTANCE' && n.name === '服务标签')
  setTagInstance(promos[0], card.promo, warnings)
  const svc = Array.isArray(card.services) ? card.services : []
  if (svc.length > 2) warnings.push(`P_card_v2 services ${svc.length} > 2，已截断`)
  services.forEach((node, i) => setTagInstance(node, svc[i], warnings))
}

/* 基础名 → 真实 key。⚠ 读 mainComponent 的 componentPropertyDefinitions
 * （inst.componentProperties 在 setProperties 前为空，不可用）。 */
function baseMap(mc) {
  if (mc && mc.parent && mc.parent.type === 'COMPONENT_SET') mc = mc.parent
  const defs = (mc && mc.componentPropertyDefinitions) || {}
  const m = {}
  for (const k of Object.keys(defs)) m[k.replace(/#[^#]+$/, '')] = k
  return m
}
