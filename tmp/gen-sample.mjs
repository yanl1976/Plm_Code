import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

// 故意在表头上方留两行标题/说明，验证「表头行自动识别」
const aoa = [
  ['正泰 NB8-40J 小型断路器 选型表（示例数据，仅供测试选型库导入）'],
  ['注：额定电流为基准温度 30℃ 下的值；分断能力按脱扣曲线区分。'],
  ['小类号', '型号', '极数', '额定电流(A)', '脱扣曲线', '分断能力(kA)', '额定电压(V)', '接线能力(mm²)', '可配附件'],
]

const push = (poles, current, curve, breaking) => {
  const model = `NB8-40J ${poles} ${curve}${current}`
  const acc = poles === '1P' ? 'S9/V9' : 'S9/V9/XF9'
  aoa.push([100105, model, poles, current, curve, breaking, 230, '1~16', acc])
}

// 1P：B/C 曲线，1~40A
for (const c of [1, 2, 3, 4, 6, 10, 16, 20, 25, 32, 40]) push('1P', c, 'C', 6)
for (const c of [6, 10, 16, 20]) push('1P', c, 'B', 6)
// 2P
for (const c of [6, 10, 16, 20, 25, 32]) push('2P', c, 'C', 6)
// 3P
for (const c of [10, 16, 20, 25, 32, 40]) push('3P', c, 'C', 6)
// 4P：D 曲线
for (const c of [16, 20, 25, 32, 40]) push('4P', c, 'D', 4.5)

const ws = XLSX.utils.aoa_to_sheet(aoa)
ws['!cols'] = [{ wch: 10 }, { wch: 22 }, { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 18 }]

const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, '型号清单')

const out = path.join('doc', '示例-NB8-40J选型表.xlsx')
fs.writeFileSync(out, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
console.log('已生成：' + out + '（' + (aoa.length - 3) + ' 行型号数据）')

// 顺手跑一遍 parse，确认能被正确识别
const b64 = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,'
  + fs.readFileSync(out).toString('base64')
const p = await fetch('http://127.0.0.1:3100/api/plm/select/parse', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileName: '示例-NB8-40J选型表.xlsx', data: b64 }),
}).then((r) => r.json())

console.log('解析结果 =>', JSON.stringify({
  ok: p.ok, headerRow: p.headerRow, total: p.total,
  columns: (p.columns || []).map((c) => `${c.key}(${c.type}${c.unit ? '/' + c.unit : ''}${c.role === 'model' ? '/型号列' : ''})`),
}, null, 0))

process.exit(0)
