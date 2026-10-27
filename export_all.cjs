const fs = require('fs')
const XLSX = require('xlsx-js-style')
const p = 'E:/tedri_project/dev/Plm_Code/src/config/feature-templates.json'
const t = JSON.parse(fs.readFileSync(p, 'utf8'))
const tpl = t.templates
const dir = 'E:/tedri_project/dev/Plm_Code/data/'
const b = JSON.parse(fs.readFileSync(dir + 'extract-baseline.json', 'utf8'))
const items = b.items || {}
const lines = fs.readFileSync(dir + 'materials.ndjson', 'utf8').split('\n').filter(Boolean)
const grouped = {}
for (const l of lines) {
  let mm; try { mm = JSON.parse(l) } catch { continue }
  const code = mm.SUBPREFIX || String(mm.FNUMBER || '').slice(0, 6)
  if (!code) continue
  ;(grouped[code] = grouped[code] || []).push(mm)
}
const outDir = 'E:/tedri_project/dev/Plm_Code/doc/物料导出模板/'
fs.mkdirSync(outDir, { recursive: true })

function dispWidth(str) {
  str = String(str || '')
  let w = 0
  for (const ch of str) w += /[⺀-鿿豈-﫿＀-￯　-〿]/.test(ch) ? 2 : 1
  return w
}
function styleSheet(ws, headerCols) {
  ws['!cols'] = headerCols.map(h => ({ wch: Math.max(10, Math.min(40, dispWidth(h) + 2)) }))
  const range = XLSX.utils.decode_range(ws['!ref'])
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cell = ws[addr]
      if (!cell) continue
      cell.s = {
        alignment: { vertical: 'top', horizontal: 'left', wrapText: true },
        font: r === 0 ? { bold: true } : {}
      }
    }
  }
}

let fileCnt = 0, matCnt = 0
const skipped = []
for (const [mk, m] of Object.entries(tpl)) {
  for (const sub of (m.subs || [])) {
    const sc = sub.code, sn = sub.name || ''
    const params = (m.subParams && m.subParams[sc]) || m.params
    const mats = grouped[sc] || []
    const header = ['物料编码', '物料名称', '规格型号', '主要参数', '技术参数', ...params, '厂家', '单位']
    const wb = XLSX.utils.book_new()
    const ov = [['物料编码', '物料名称', '规格型号', '主要参数', '技术参数', '单位']]
    for (const mm of mats) ov.push([mm.FNUMBER || '', mm.FNAME || '', mm.FSPECIFICATION || '', mm.F_ZXCV_ZYCS || '', mm.F_ZXCV_JSCS || '', mm.UNITNAME || ''])
    const wsSum = XLSX.utils.aoa_to_sheet(ov)
    styleSheet(wsSum, ov[0])
    XLSX.utils.book_append_sheet(wb, wsSum, '汇总明细')
    for (const mm of mats) {
      const num = String(mm.FNUMBER || '')
      const ex = items[num] || {}
      const row = [num, mm.FNAME || '', mm.FSPECIFICATION || '', mm.F_ZXCV_ZYCS || '', mm.F_ZXCV_JSCS || '']
      for (const pp of params) row.push(ex[pp] || '')
      row.push(mm.F_ZXCV_GYS || '', mm.UNITNAME || '')
      const ws = XLSX.utils.aoa_to_sheet([header, row])
      styleSheet(ws, header)
      XLSX.utils.book_append_sheet(wb, ws, num)
      matCnt++
    }
    const fn = (sc + sn).replace(/[\\/:*?"<>|\r\n]/g, '_')
    const full = outDir + fn + '.xlsx'
    try {
      XLSX.writeFile(wb, full)
      fileCnt++
    } catch (e) {
      if (e && e.code === 'EBUSY') skipped.push(fn + '.xlsx')
      else throw e
    }
  }
}
console.log('导出中类文件数 =', fileCnt, ' 物料sheet数 =', matCnt)
if (skipped.length) console.log('被占用跳过(请关闭Excel后重跑) =', skipped.length, skipped)
