/**
 * render-scheme.js —— 对话流方案「确定性渲染器」（v3 · token 实时解析）
 * =================================================================
 * 冻结代码：用设计师维护的本地组件库确定性装配。LLM 只产出 content schema，
 * 不写任何 Relay 布局 API。
 *
 * 用法（在 use_design_script 里）：
 *   1) 读本文件全文（禁止凭记忆重建）→ 粘到脚本头部
 *   2) 末尾写：  return await renderScheme(SCHEME)
 *
 * 防漂移设计：
 *   - 组件按【名字 token】实时解析（TOKENS），不硬编码 node ID
 *     → 设计师改 ID / 加前缀 / 扩库，渲染器自动适配
 *   - 组件清单 / 属性 不在本文件维护，权威源在 Relay；本文件只编码「怎么拼」
 *   - 对不上的组件 / 属性 → 收集进 warnings，生成时即暴露漂移
 *
 * 拼装模型见 design/assembly-spec.md（间距、wrapper、范式参考板索引）。
 * =================================================================
 */

/* ── 逻辑名 → 组件名 token（唯一的稳定契约；与 assembly-spec.md 同步） ──
 * 匹配规则：组件名 includes(token)。token 取设计师命名里稳定的部分。 */
const TOKENS = {
  header: '加载完成',
  body: '正文',
  h1: '一级标题',
  h2: '二级标题',
  more_btn: '更多按钮',
  all_products: '全部商品按钮',
  product_card_h: 'P_card_h',
  product_card_v: 'P_card_v',
  filter_card: '筛选卡',
  r_card_scheme: 'R_cardScheme',
}

const COLOR = { WHITE: { r: 1, g: 1, b: 1 } }
const PAGE_WIDTH = 375
const STACK_GAP = 6 // 区块间统一间距（assembly-spec §拼装模型）

/* ───────────────────────── 顶层入口 ───────────────────────── */
async function renderScheme(scheme) {
  const warnings = []
  await setupPageAndFonts()
  buildCompCache()
  const root = buildRoot(scheme.title || '对话流方案')

  for (const block of scheme.blocks || []) {
    switch (block.type) {
      case 'header': appendFixed(root, 'header', warnings); break
      case 'body': appendTextBlock(root, 'body', block.text, warnings); break
      case 'h1': appendH1(root, block, warnings); break
      case 'h2': appendTextBlock(root, 'h2', block.text, warnings); break
      case 'card': appendCardH(root, block, warnings); break
      case 'row_v': appendRowV(root, block, warnings); break
      case 'filter_card': appendFilterCard(root, block, warnings); break
      case 'r_card_scheme': appendRScheme(root, block, warnings); break
      case 'all_products': appendFixed(root, 'all_products', warnings); break
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

/* ───────────── 组件解析：按 token 实时查找（不硬编码 ID） ───────────── */
let COMP_CACHE = null
function buildCompCache() {
  // 当前页所有顶层 COMPONENT / COMPONENT_SET（排除变体子组件）
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

// 固定内容组件（header / all_products）
function appendFixed(root, logical, warnings) {
  const inst = instOf(logical, warnings); if (!inst) return
  if (logical === 'header') {
    const wrap = makeWrapper(root, 'VERTICAL'); wrap.paddingBottom = 13 // header 下留白
    wrap.appendChild(inst); inst.layoutSizingHorizontal = 'FILL'
  } else {
    root.appendChild(inst); inst.layoutSizingHorizontal = 'FILL'
  }
}

// 文本组件（body / h2）
function appendTextBlock(root, logical, text, warnings) {
  const inst = instOf(logical, warnings); if (!inst) return
  root.appendChild(inst); inst.layoutSizingHorizontal = 'FILL'
  setProps(inst, { 内容: text }, warnings)
}

// h1 行：HORIZONTAL wrapper（上 padding 9，SPACE_BETWEEN）+ 一级标题 [+ 更多按钮]
function appendH1(root, block, warnings) {
  const wrap = makeWrapper(root, 'HORIZONTAL')
  wrap.paddingTop = 9
  wrap.primaryAxisAlignItems = 'SPACE_BETWEEN'
  try { wrap.counterAxisAlignItems = 'BASELINE' } catch (e) { wrap.counterAxisAlignItems = 'CENTER' }
  wrap.itemSpacing = 12
  const title = instOf('h1', warnings)
  if (title) { wrap.appendChild(title); title.layoutSizingHorizontal = 'HUG'; setProps(title, { 内容: block.text }, warnings) }
  if (block.more) {
    const more = instOf('more_btn', warnings)
    if (more) { wrap.appendChild(more); more.layoutSizingHorizontal = 'HUG' }
  }
}

// card：VERTICAL wrapper（上下 padding 3）+ P_card_h
function appendCardH(root, card, warnings) {
  const wrap = makeWrapper(root, 'VERTICAL'); wrap.paddingTop = 3; wrap.paddingBottom = 3
  const inst = instOf('product_card_h', warnings); if (!inst) return
  wrap.appendChild(inst); inst.layoutSizingHorizontal = 'FILL'
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

// row_v：竖卡 2 列，HORIZONTAL 横排，间距 7
function appendRowV(root, block, warnings) {
  const wrap = makeWrapper(root, 'HORIZONTAL'); wrap.itemSpacing = 7
  for (const card of (block.cards || []).slice(0, 2)) {
    const inst = instOf('product_card_v', warnings); if (!inst) continue
    wrap.appendChild(inst); inst.layoutSizingHorizontal = 'FILL'
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
}

// filter_card：内含 一级标题 实例 + 3 个 筛选卡 选项实例（变体 属性1）
function appendFilterCard(root, block, warnings) {
  const inst = instOf('filter_card', warnings); if (!inst) return
  root.appendChild(inst); inst.layoutSizingHorizontal = 'FILL'
  const titleInst = inst.findOne((n) => n.type === 'INSTANCE' && (n.mainComponent?.name || '').includes('一级标题'))
  if (titleInst && block.title) setProps(titleInst, { 内容: block.title }, warnings)
  const opts = inst.findAll((n) => n.type === 'INSTANCE' && n.name === '筛选卡')
  const data = block.options || []
  for (let i = 0; i < Math.min(opts.length, data.length); i++) {
    const o = data[i]
    setProps(opts[i], {
      属性1: o.selected ? '已选中' : '未选中',
      ...(o.text ? { 内容: o.text } : {}),
      ...(o.desc ? { 描述: o.desc, 展示描述: true } : {}),
    }, warnings)
  }
}

// r_card_scheme：3×2 网格，子卡是 F_card_L / F_card_S，仅有「价格」属性
function appendRScheme(root, block, warnings) {
  const inst = instOf('r_card_scheme', warnings); if (!inst) return
  root.appendChild(inst); inst.layoutSizingHorizontal = 'FILL'
  const cards = inst.findAll((n) => n.type === 'INSTANCE' && /F_card_[LS]/.test(n.mainComponent?.name || ''))
  const prices = block.prices || []
  for (let i = 0; i < Math.min(cards.length, prices.length); i++) {
    setProps(cards[i], { 价格: stripYen(prices[i]) }, warnings)
  }
}

/* 嵌套标签（促销标×1 + 服务标×N），P_card_h / P_card_v 共用 */
function fillTags(inst, card, warnings) {
  const promos = inst.findAll((n) => n.type === 'INSTANCE' && n.name === '促销标')
  const services = inst.findAll((n) => n.type === 'INSTANCE' && n.name === '服务标')
  setTag(promos[0], card.promo, warnings)
  const svc = Array.isArray(card.services) ? card.services : []
  if (svc.length > services.length) warnings.push(`服务标 ${svc.length} 个 > ${services.length} 槽位，已截断`)
  services.forEach((node, i) => setTag(node, svc[i], warnings))
}
function setTag(node, text, warnings) {
  if (!node) return
  if (!has(text)) { node.visible = false; return }
  setProps(node, { 文本: String(text) }, warnings)
}

/* ───────────────────────── 工具 ───────────────────────── */
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
function makeWrapper(parent, direction) {
  const w = relay.createAutoLayout(direction)
  parent.appendChild(w)
  w.layoutSizingHorizontal = 'FILL'
  w.fills = []
  return w
}
function hideByName(inst, name) {
  const n = inst.findOne((x) => x.name === name)
  if (n) n.visible = false
}
function has(v) { return v != null && v !== '' }
// 价格统一兜底去前导 ¥（组件自带 ¥，schema 传纯数字或含 ¥ 都安全）
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
