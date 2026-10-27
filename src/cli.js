#!/usr/bin/env node
/**
 * 物料主数据治理 CLI。
 * 命令：
 *   extract [--limit N]              全量提取 ERP 物料 -> data/materials.ndjson/csv/stats
 *   ai-extract [--cats 断路器,电缆] [--limit N] [--profile cloud|local] [--dry]   LLM 补缺项（规则优先，结果烘焙 ai-overlay.json；AI_EXTRACT=1 回灌）
 *   dedup [--fuzzy]                  强制查重：一物多号 / 一号多物 / 近重
 *   validate [--accept]              提取校验：黄金样例 + 格式契约 + 覆盖率 + 新旧规则对比（--accept 固化基线）
 *   learn [--top N] [--apply <plan>]   自学习：差异聚合+检索词清单；--apply 把外网确认的定义写回规则表
 *   report                          打印查重报告摘要
 *   classify                        打印提取统计 + 未分类前缀分布
 *   mapping add <old> <new> [--reason R] [--by B]   旧编码->主编码（映射法）
 *   mapping freeze <no> [--reason R]                 冻结（冷冻法，不再使用）
 *   mapping list                                      列出映射/冻结
 *   mapping validate [--numbers]                      校验映射无环/主编码存在
 *   mapping build                                     归并出统一物料视图
 */
import { runExtract } from './extract.js'
import { runDedup } from './dedup.js'
import { runValidation } from './validate.js'
import { runLearn } from './learn.js'
import { runAiExtract } from './ai/index.js'
import * as map from './mapping.js'
import { generateAndSave } from './feature-templates.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = path.join(ROOT, 'data')

function arg(name) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : undefined
}
function flag(name) { return process.argv.includes(name) }

async function main() {
  const cmd = process.argv[2]
  switch (cmd) {
    case 'extract': {
      const limit = arg('--limit') ? parseInt(arg('--limit'), 10) : 0
      await runExtract({ limit })
      break
    }
    case 'dedup': {
      await runDedup({ fuzzy: flag('--fuzzy') })
      break
    }
    case 'learn': {
      const top = arg('--top') ? parseInt(arg('--top'), 10) : 20
      await runLearn({ topN: top, applyFile: arg('--apply') || '' })
      break
    }
    case 'validate': {
      const r = await runValidation({ accept: flag('--accept') })
      process.exitCode = r.pass ? 0 : 1
      break
    }
    case 'ai-extract': {
      await runAiExtract({
        cats: arg('--cats') || '断路器,电缆',
        limit: arg('--limit') ? parseInt(arg('--limit'), 10) : 60,
        profile: arg('--profile') || 'cloud',
        dry: flag('--dry'),
      })
      break
    }
    case 'report': {
      const f = path.join(DATA_DIR, 'dedup-report.json')
      if (!fs.existsSync(f)) { console.log('尚未运行 dedup'); break }
      console.log(JSON.stringify(JSON.parse(fs.readFileSync(f, 'utf8')), null, 2))
      break
    }
    case 'classify': {
      const f = path.join(DATA_DIR, 'stats.json')
      if (!fs.existsSync(f)) { console.log('尚未运行 extract'); break }
      const s = JSON.parse(fs.readFileSync(f, 'utf8'))
      console.log(`总量=${s.total} 唯一编码=${s.uniqueFNumber} 多副本编码数=${s.fNumberWithMultipleCopies}`)
      console.log(`型号规格为空=${s.emptySpec} 名称为空=${s.emptyName} 关联PLM=${s.hasPlmLink} 禁用=${s.forbid}`)
      console.log('未分类前缀(前10):', Object.entries(s.subPrefixCount || {}).slice(0, 10))
      break
    }
    case 'mapping': {
      const sub = process.argv[3]
      if (sub === 'add') {
        const oldNo = process.argv[4], newNo = process.argv[5]
        if (!oldNo || !newNo) { console.log('用法: mapping add <old> <new> [--reason R]'); break }
        map.addMapping(oldNo, newNo, { reason: arg('--reason') || '', by: arg('--by') || 'cli' })
        console.log(`已添加映射 ${oldNo} -> ${newNo}`)
      } else if (sub === 'freeze') {
        const no = process.argv[4]
        if (!no) { console.log('用法: mapping freeze <no> [--reason R]'); break }
        map.freeze(no, { reason: arg('--reason') || '', by: arg('--by') || 'cli' })
        console.log(`已冻结 ${no}`)
      } else if (sub === 'list') {
        console.log('映射:', JSON.stringify(map.loadMapping(), null, 2))
        console.log('冻结:', JSON.stringify(map.loadFreeze(), null, 2))
      } else if (sub === 'validate') {
        const r = map.validateMapping()
        console.log('校验:', JSON.stringify(r, null, 2))
      } else if (sub === 'build') {
        await map.buildUnified()
      } else {
        console.log('mapping 子命令: add / freeze / list / validate / build')
      }
      break
    }
    case 'feature-templates': {
      const r = generateAndSave()
      console.log(`已生成中类标准模板：${r.mids} 个中类，共 ${r.params} 条参数定义 -> src/config/feature-templates.json`)
      break
    }
    default:
      console.log(`未知命令: ${cmd}\n可用: extract / dedup / validate / learn / report / classify / mapping / feature-templates`)
  }
}

main().then(() => process.exit(process.exitCode || 0)).catch((e) => { console.error(e); process.exit(1) })
