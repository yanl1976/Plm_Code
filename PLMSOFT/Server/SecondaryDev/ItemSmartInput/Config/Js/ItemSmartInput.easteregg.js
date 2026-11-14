/**
 * 物料录入助手 —— 彩蛋模块（礼花动画）
 *
 * 独立文件，由 ItemSmartInput.fileref 注册，与主插件无耦合：
 *   主插件只在「保存并回填成功」后调用一次 window.__plmEgg.tick()
 *   删除 fileref 里对应的两行即可整体移除，不用改主插件
 *
 * 触发规则（都可在 ItemSmartInput.config.js 的 easterEgg 里改）：
 *   每 every（默认 100）次回填       → 放一次礼花，级别随累计次数升高
 *   累计达到 milestones（500/1000…） → 同一时刻额外放一次更高级别
 *
 * 复杂度阶梯：
 *   < 500      1 波 × 40 粒子
 *   500~999    2 波 × 60 粒子，带拖尾
 *   1000~1499  3 波 × 80 粒子，双色，屏幕中上显示累计次数
 *   1500+      4~5 波 × 100~120 粒子，全屏
 *
 * 设计原则（避免打扰工作）：
 *   ① 全屏 canvas 且 pointer-events:none，不遮挡、不拦截任何点击
 *   ② 只在保存成功后触发，输入过程中不弹
 *   ③ 约 3.6 秒自动清零并移除 DOM
 *   ④ 可随时关：__plmEgg.off()（本次会话）或 config 里 enabled:false（永久）
 *
 * 调试命令（F12 Console）：
 *   __plmEgg.status()      看累计次数与当前级别
 *   __plmEgg.test(3)       直接放一次 3 级礼花（不影响计数）
 *   __plmEgg.reset()       计数清零
 *   __plmEgg.off()         本次会话关闭
 */
(function (window, document) {
  'use strict'

  var DEFAULTS = {
    enabled: true,
    every: 100,
    milestones: [500, 1000, 1500, 2000, 3000, 5000],
    durationMs: 3600,
  }
  var KEY_COUNT = 'plmSmartEggCount'
  var KEY_LAST = 'plmSmartEggLastAt'
  var PALETTE = ['#ff5c5c', '#ffb400', '#4caf50', '#29b6f6', '#ab47bc', '#ff8a65', '#ffd54f']

  function cfg() {
    var c = (window.ItemSmartInputConfig && window.ItemSmartInputConfig.easterEgg) || {}
    return {
      enabled: c.enabled !== false,
      every: Math.max(10, Number(c.every) || DEFAULTS.every),
      milestones: (Array.isArray(c.milestones) && c.milestones.length) ? c.milestones : DEFAULTS.milestones,
      durationMs: Math.max(800, Number(c.durationMs) || DEFAULTS.durationMs),
    }
  }

  function readCount() {
    try { return Number(window.localStorage.getItem(KEY_COUNT) || 0) || 0 } catch (e) { return 0 }
  }
  function writeCount(n) {
    try { window.localStorage.setItem(KEY_COUNT, String(n)) } catch (e) { /* 隐私模式忽略 */ }
  }
  function log() {
    var a = [].slice.call(arguments)
    a.unshift('[彩蛋]')
    if (window.console && console.log) console.log.apply(console, a)
  }

  /** 累计次数 → 礼花级别（0=基础，等级越高越热闹） */
  function levelOf(n, milestones) {
    var lv = 0
    for (var i = 0; i < milestones.length; i++) if (n >= milestones[i]) lv = i + 1
    return lv
  }

  /**
   * 放礼花
   * @param {number} level 级别 0~5
   * @param {number} total 当前累计次数（达到 1000 起显示在屏幕上）
   */
  function launch(level, total) {
    var c = cfg()
    if (!c.enabled) return
    if (!document.body) return

    var dpr = Math.min(window.devicePixelRatio || 1, 2)
    var W = window.innerWidth
    var H = window.innerHeight

    var cv = document.createElement('canvas')
    cv.className = 'plm-smart-egg-canvas'
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;'
      + 'pointer-events:none;z-index:2147483999;'
    cv.width = Math.floor(W * dpr)
    cv.height = Math.floor(H * dpr)
    document.body.appendChild(cv)

    var ctx = cv.getContext('2d')
    if (!ctx) { try { document.body.removeChild(cv) } catch (e) { } return }
    ctx.scale(dpr, dpr)

    var lv = Math.max(0, Math.min(5, Number(level) || 0))
    var waves = Math.min(1 + lv, 5)
    var perWave = Math.min(40 + lv * 20, 120)
    var useTrail = lv >= 1
    var parts = []
    var timers = []

    function burst(cx, cy, n) {
      for (var i = 0; i < n; i++) {
        var ang = Math.random() * Math.PI * 2
        var sp = 2 + Math.random() * (4 + lv)
        parts.push({
          x: cx, y: cy,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 1.6,
          r: 1 + Math.random() * 2,
          color: PALETTE[(Math.random() * PALETTE.length) | 0],
          life: 1,
          decay: 0.008 + Math.random() * 0.012,
        })
      }
    }

    // 多波次：错开时间在屏幕中上部随机位置炸开
    for (var w = 0; w < waves; w++) {
      (function (idx) {
        timers.push(window.setTimeout(function () {
          var cx = W * (0.28 + Math.random() * 0.44)
          var cy = H * (0.18 + Math.random() * 0.28)
          burst(cx, cy, perWave)
        }, idx * 230))
      })(w)
    }

    var t0 = Date.now()
    var raf = 0

    function cleanup() {
      for (var i = 0; i < timers.length; i++) window.clearTimeout(timers[i])
      if (raf) { try { window.cancelAnimationFrame(raf) } catch (e) { } }
      try { if (cv.parentNode) cv.parentNode.removeChild(cv) } catch (e) { }
    }

    function frame() {
      var elapsed = Date.now() - t0
      if (elapsed > c.durationMs) { cleanup(); return }

      // 拖尾：只擦除 canvas 自身像素，不会遮挡页面
      if (useTrail) {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = 'rgba(0,0,0,0.16)'
        ctx.fillRect(0, 0, W, H)
        ctx.globalCompositeOperation = 'lighter'
      } else {
        ctx.clearRect(0, 0, W, H)
      }

      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]
        p.vy += 0.09          // 重力
        p.vx *= 0.99          // 空气阻力
        p.vy *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.life -= p.decay
        if (p.life <= 0) { parts.splice(i, 1); continue }
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // 累计 1000 次以上，屏幕中上部显示一行字（带阴影，深浅背景都看得清）
      if (lv >= 2 && total >= 1000) {
        var alpha = Math.min(1, Math.max(0, 1 - elapsed / c.durationMs) * 2)
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.textAlign = 'center'
        ctx.font = 'bold 26px "Microsoft YaHei",Arial,sans-serif'
        ctx.shadowColor = 'rgba(0,0,0,.55)'
        ctx.shadowBlur = 8
        ctx.fillStyle = '#ffffff'
        ctx.fillText('已累计 ' + total + ' 次录入', W / 2, H * 0.16)
        ctx.restore()
      }

      raf = window.requestAnimationFrame(frame)
    }

    raf = window.requestAnimationFrame(frame)
    log('礼花 Lv.' + lv + '（第 ' + total + ' 次）')
  }

  var lastAt = 0
  try { lastAt = Number(window.localStorage.getItem(KEY_LAST) || 0) || 0 } catch (e) { }

  /** 主插件在「保存并回填成功」后调用 */
  function tick() {
    var c = cfg()
    if (!c.enabled) return
    var n = readCount() + 1
    writeCount(n)
    var isMilestone = c.milestones.indexOf(n) >= 0
    if (n % c.every === 0 || isMilestone) {
      launch(levelOf(n, c.milestones), n)
      try { window.localStorage.setItem(KEY_LAST, String(Date.now())) } catch (e) { }
    }
  }

  window.__plmEgg = {
    tick: tick,
    status: function () {
      var c = cfg()
      var n = readCount()
      log('累计 ' + n + ' 次｜每 ' + c.every + ' 次触发｜当前级别 ' + levelOf(n, c.milestones)
        + '｜开关 ' + (c.enabled ? '开' : '关'))
      return { count: n, every: c.every, level: levelOf(n, c.milestones), enabled: c.enabled, milestones: c.milestones }
    },
    test: function (lv) { launch(Number(lv == null ? 3 : lv), readCount()) },
    reset: function () { writeCount(0); log('计数已清零') },
    off: function () {
      try {
        window.ItemSmartInputConfig = window.ItemSmartInputConfig || {}
        window.ItemSmartInputConfig.easterEgg = window.ItemSmartInputConfig.easterEgg || {}
        window.ItemSmartInputConfig.easterEgg.enabled = false
        log('本次会话已关闭彩蛋（要永久关闭请改 config.js 的 easterEgg.enabled=false）')
      } catch (e) { }
    },
  }

  log('彩蛋模块已加载｜__plmEgg.status() 查看累计次数')
})(window, document)
