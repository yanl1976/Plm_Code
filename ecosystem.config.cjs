/**
 * PM2 进程定义 —— 两个独立服务，端口全部由项目根 .env 决定
 *
 * 用法：
 *   pm2 start ecosystem.config.cjs        # 启动（首次）/ 按最新配置重建
 *   pm2 restart plm-api plm-web           # 重启
 *   pm2 logs plm-api --lines 50           # 看日志
 *   pm2 delete plm-api plm-web            # 停止并移除（不影响同机其它 PM2 应用）
 *   pm2 save                              # 固化进程列表，配合 pm2 startup 开机自启
 *
 * 设计说明（很重要）：
 *   1) 这里【不写端口】。端口只认 .env 的 PORT（治理看板）/ PLM_API_PORT（PLM 接口），
 *      避免出现「ecosystem 与 .env 两处配置、改一处不生效」的漂移。
 *      临时改端口：先改 .env，再 pm2 restart plm-api plm-web。
 *   2) 用 fork 单实例，不用 cluster：两个服务各自持有内存索引与定时器，
 *      多实例会重复加载 data/materials.ndjson、重复跑快照检查，纯属浪费。
 *   3) 端口被占用时 server.js 会 FATAL 退出（默认不自动 +1），PM2 按退避策略重试；
 *      遇到反复重启，先 `pm2 logs` 确认是不是端口占用，再停掉手工起的 node 进程。
 *   4) .env 由 src/env.js 用【绝对路径】加载，与 PM2 的 cwd 无关；
 *      但 cwd 仍设为项目根，便于将来若有相对路径读写的脚本不出错。
 */
const path = require('path')

const ROOT = __dirname

module.exports = {
  apps: [
    {
      name: 'plm-api',
      script: 'src/plm-server.js',
      cwd: ROOT,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      exp_backoff_restart_delay: 5000,
      max_memory_restart: '600M',
      kill_timeout: 5000,
      time: true,
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'plm-web',
      script: 'src/server.js',
      cwd: ROOT,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      exp_backoff_restart_delay: 5000,
      max_memory_restart: '1G',
      kill_timeout: 5000,
      time: true,
      env: { NODE_ENV: 'production' },
    },
  ],
}
