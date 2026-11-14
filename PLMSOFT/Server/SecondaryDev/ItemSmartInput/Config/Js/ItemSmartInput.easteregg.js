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
  var TAU = Math.PI * 2
  // 主色调（HSL 色相），按「对比度」排序：
  // 前三个是红 / 绿 / 蓝（三原色，低档位只有 3 色时也最鲜艳），
  // 后面依次补金 / 紫 / 青，色相尽量拉开，避免一片相近的暖色。
  var HUES = [0, 120, 210, 45, 290, 180]

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
    if (window.console && window.console.log) window.console.log.apply(window.console, a)
  }

  /** 累计次数 → 礼花级别（0=基础，等级越高越热闹；只用于里程碑判定与文字） */
  function levelOf(n, milestones) {
    var lv = 0
    for (var i = 0; i < milestones.length; i++) if (n >= milestones[i]) lv = i + 1
    return lv
  }

  /**
   * 强度：随累计次数「持续递增」，不封顶（对数增长，越到后期每次提升仍可见）
   *
   *   100      1→2 波 × 约 42 粒子
   *   500      3 波 × 约 61
   *   1,000    3 波 × 约 72
   *   1,500    4 波 × 约 78
   *   5,000    6 波 × 约 98
   *   20,000   8 波 × 约 122
   *   100,000  9 波 × 约 150
   *
   * 只设性能硬上限（10 波 / 每波 200），避免浏览器卡死；其余维度继续增长。
   */
  function strengthOf(total) {
    var n = Math.max(0, Number(total) || 0)
    var s = Math.log2(1 + n / 100)        // 次数 → 强度刻度：100→1，1500→4，5000→5.67，100k→9.97
    return {
      // 基础档也要有场面：最低 3 波 × 70，而不是原来的 1 波 × 40
      waves: Math.min(Math.max(3, Math.round(3 + s * 0.9)), 10),        // 波数 3~10
      perWave: Math.min(Math.max(70, Math.round(60 + s * 14)), 150),    // 每波粒子 70~150
      petals: Math.min(2 + Math.floor(s * 0.9), 6),                     // 二次小爆的朵数
      spread: Math.min(5 + s * 0.5, 11),                                // 爆炸初速
      radius: Math.min(1.1 + s * 0.13, 3),                              // 粒子半径
      // 时长要覆盖：升空(约 0.3s) + 主爆 + 二次爆(约 0.4s) + 余烬飘落
      duration: Math.min(4200 + s * 320, 8200),
      colors: Math.min(4 + Math.floor(s * 0.5), HUES.length),           // 可用颜色数（基础 4 色）
      trailAt: 0,                                                       // 全等级都开拖尾
      textAt: 1000,                                                     // 累计超过这个数就显示次数
    }
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

    // 强度按累计次数持续递增（不封顶），level 只用于调试时手动指定
    var st = strengthOf(total == null ? readCount() : total)
    if (level != null && level > 0) {
      // 手动 test(level) 时按级别放大，便于预览
      st.waves = Math.min(1 + Number(level), 10)
      st.perWave = Math.min(40 + Number(level) * 20, 200)
    }
    // 配置里的 durationMs 作为「最短时长」，强度提升时自动延长
    st.duration = Math.max(st.duration, c.durationMs)
    var waves = st.waves
    var perWave = st.perWave
    var useTrail = (total == null ? readCount() : total) >= st.trailAt
    var huePool = HUES.slice(0, Math.max(3, Math.min(st.colors, HUES.length)))
    var parts = []       // 所有粒子（含主爆/二次爆/余烬）
    var rings = []       // 爆炸瞬间的冲击波光环
    var rockets = []     // 升空中的光点
    var flashes = []     // 爆炸瞬间的屏幕泛光
    var timers = []

    /** 余烬：少量缓慢下落的火星，负责收尾 */
    function addEmbers(cx, cy, n, hue) {
      for (var i = 0; i < n; i++) {
        var ang = Math.random() * TAU
        var sp = 0.3 + Math.random() * 1.4
        parts.push({
          x: cx, y: cy,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 0.4,
          r: 0.6 + Math.random() * 0.9,
          hue: hue + (Math.random() * 20 - 10),
          light: 50 + Math.random() * 12,
          life: 1,
          decay: 0.0025 + Math.random() * 0.003,   // 活得很久，慢慢飘落
          trail: false,
          ember: true,
          px: cx, py: cy,
        })
      }
    }

    /** 从可用色里随机挑 2~3 个，让同一次爆炸本身就是多彩的 */
    function pickHues() {
      var want = Math.min(huePool.length, 2 + Math.floor(Math.random() * 2))
      var out = []
      for (var i = 0; i < want; i++) out.push(huePool[(Math.random() * huePool.length) | 0])
      return out
    }

    /**
     * 一次爆炸 = 主爆 + 二次小爆 + 余烬
     * 三层结构 + 多色混合：同一次爆炸里带 2~3 种鲜明颜色，而不是单色一片
     * @param {number[]} [huesIn] 指定色系（二次爆继承主爆颜色）；不传则随机挑
     */
    function burst(cx, cy, n, huesIn) {
      var hues = (huesIn && huesIn.length) ? huesIn : pickHues()
      var mainHue = hues[0]
      rings.push({ x: cx, y: cy, r: 3, hue: mainHue, life: 1 })
      flashes.push({ x: cx, y: cy, hue: mainHue, life: 1 })

      for (var i = 0; i < n; i++) {
        var ang = Math.random() * TAU
        var t = Math.random()
        var sp = 2.4 + t * t * (st.spread + 2)   // t² 让快慢分层更明显
        var h = hues[(Math.random() * hues.length) | 0]
        parts.push({
          x: cx, y: cy,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 1.8,
          r: 0.9 + Math.random() * st.radius,
          hue: h + (Math.random() * 14 - 7),          // 小幅抖动，保持颜色纯净
          // HSL 的 lightness 越低越「浓」：80% 是粉彩色（近白），50~60% 才是饱和纯色。
          // 白热阶段（life>0.88）另用纯白，不靠提高亮度来表现。
          light: 47 + Math.random() * 15,
          life: 1,
          decay: 0.005 + Math.random() * 0.015,
          trail: Math.random() < 0.45,
          px: cx, py: cy,
        })
      }
      addEmbers(cx, cy, Math.max(6, Math.round(n * 0.12)), mainHue)

      // 二次小爆：主爆外围补几朵，形成「簇」，颜色沿用主爆的色系
      for (var k = 0; k < st.petals; k++) {
        (function (idx) {
          timers.push(window.setTimeout(function () {
            var pa = Math.random() * TAU
            var pd = 45 + Math.random() * 95
            var px2 = cx + Math.cos(pa) * pd
            var py2 = cy + Math.sin(pa) * pd * 0.7
            var pn = Math.max(8, Math.round(n * 0.22))
            rings.push({ x: px2, y: py2, r: 2, hue: hues[idx % hues.length], life: 0.8 })
            for (var m = 0; m < pn; m++) {
              var a2 = Math.random() * TAU
              var sp2 = 1.2 + Math.random() * (st.spread * 0.55)
              parts.push({
                x: px2, y: py2,
                vx: Math.cos(a2) * sp2,
                vy: Math.sin(a2) * sp2 - 1,
                r: 0.7 + Math.random() * st.radius * 0.7,
                hue: hues[(Math.random() * hues.length) | 0] + (Math.random() * 14 - 7),
                light: 48 + Math.random() * 14,
                life: 1,
                decay: 0.008 + Math.random() * 0.014,
                trail: Math.random() < 0.3,
                px: px2, py: py2,
              })
            }
          }, 170 + idx * 45))
        })(k)
      }
    }

    /** 升空：从屏幕底部射一条光点，到点后再炸开 */
    function rocket(cx, cy, n, hue) {
      rockets.push({
        sx: cx + (Math.random() * 120 - 60),
        sy: H + 20,
        tx: cx, ty: cy,
        x: cx, y: H + 20,
        t: 0, dur: 16 + Math.round(Math.random() * 8),
        hue: hue, n: n,
      })
    }

    // 多波次：每波先升空再炸开，节奏比原来更紧凑
    for (var w = 0; w < waves; w++) {
      (function (idx) {
        timers.push(window.setTimeout(function () {
          var cx = W * (0.22 + Math.random() * 0.56)
          var cy = H * (0.15 + Math.random() * 0.3)
          var hue = huePool[(Math.random() * huePool.length) | 0]
          rocket(cx, cy, perWave, hue)
        }, idx * 190))
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
      if (elapsed > st.duration) { cleanup(); return }

      // 拖尾：只擦除 canvas 自身像素，不会遮挡页面
      if (useTrail) {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = 'rgba(0,0,0,0.16)'
        ctx.fillRect(0, 0, W, H)
        ctx.globalCompositeOperation = 'lighter'
      } else {
        ctx.clearRect(0, 0, W, H)
      }

      // 升空光点：一条上升的光迹，到点后触发爆炸
      for (var ri = rockets.length - 1; ri >= 0; ri--) {
        var rk = rockets[ri]
        rk.t++
        var kr = rk.t / rk.dur
        if (kr >= 1) {
          rockets.splice(ri, 1)
          // 不传 hues：由 burst 自己挑 2~3 个主色，同一次爆炸也多彩
          burst(rk.tx, rk.ty, rk.n)
          continue
        }
        rk.x = rk.sx + (rk.tx - rk.sx) * kr
        rk.y = rk.sy + (rk.ty - rk.sy) * (1 - Math.pow(1 - kr, 2.2))   // 越升越慢
        ctx.globalAlpha = 0.95
        ctx.fillStyle = 'hsl(' + (rk.hue | 0) + ',100%,80%)'
        ctx.beginPath()
        ctx.arc(rk.x, rk.y, 2.2, 0, TAU)
        ctx.fill()
        // 上升尾迹：向下拖两三条短线
        ctx.globalAlpha = 0.32
        ctx.strokeStyle = 'hsl(' + (rk.hue | 0) + ',100%,66%)'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(rk.x, rk.y)
        ctx.lineTo(rk.x + (Math.random() * 3 - 1.5), rk.y + 18 + Math.random() * 12)
        ctx.stroke()
      }

      // 爆炸瞬间的屏幕泛光：让「炸开」有照亮感
      for (var fi = flashes.length - 1; fi >= 0; fi--) {
        var fl = flashes[fi]
        fl.life -= 0.09
        if (fl.life <= 0) { flashes.splice(fi, 1); continue }
        var rad = 260 + (1 - fl.life) * 320
        var grad = ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, rad)
        grad.addColorStop(0, 'hsla(' + (fl.hue | 0) + ',100%,72%,' + (fl.life * 0.22).toFixed(3) + ')')
        grad.addColorStop(1, 'hsla(' + (fl.hue | 0) + ',100%,72%,0)')
        ctx.globalAlpha = 1
        ctx.fillStyle = grad
        ctx.fillRect(fl.x - rad, fl.y - rad, rad * 2, rad * 2)
      }

      // 冲击波光环：快速扩散并淡出
      for (var j = rings.length - 1; j >= 0; j--) {
        var g = rings[j]
        g.r += 5 + g.r * 0.18
        g.life -= 0.045
        if (g.life <= 0) { rings.splice(j, 1); continue }
        ctx.globalAlpha = g.life * 0.28
        ctx.strokeStyle = 'hsl(' + (g.hue | 0) + ',100%,58%)'
        ctx.lineWidth = 1.6 * g.life + 0.4
        ctx.beginPath()
        ctx.arc(g.x, g.y, g.r, 0, TAU)
        ctx.stroke()
      }

      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]
        p.px = p.x
        p.py = p.y
        p.vy += 0.085                        // 重力
        p.vx *= 0.985                        // 空气阻力（下坠的弧线更自然）
        p.vy *= 0.985
        p.x += p.vx
        p.y += p.vy
        p.life -= p.decay
        if (p.life <= 0 || p.y > H + 40) { parts.splice(i, 1); continue }

        var a = p.life
        var r = p.r * (0.25 + 0.75 * a)      // 燃烧中越来越小
        var col = 'hsl(' + (p.hue | 0) + ',100%,' + (p.light | 0) + '%)'

        // 余烬：暗淡、缓慢闪烁，只画一个小点
        if (p.ember) {
          var flick = 0.55 + 0.45 * Math.sin(elapsed * 0.02 + p.x * 0.1)
          ctx.globalAlpha = a * 0.5 * flick
          ctx.fillStyle = col
          ctx.beginPath()
          ctx.arc(p.x, p.y, r * 0.85, 0, TAU)
          ctx.fill()
          continue
        }

        // 火星拖尾：一条渐隐短线
        if (p.trail) {
          ctx.globalAlpha = a * 0.45
          ctx.strokeStyle = col
          ctx.lineWidth = Math.max(0.6, r * 0.8)
          ctx.beginPath()
          ctx.moveTo(p.px, p.py)
          ctx.lineTo(p.x, p.y)
          ctx.stroke()
        }

        // 外圈光晕：大而淡，制造发光感
        ctx.globalAlpha = a * 0.2
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 3, 0, TAU)
        ctx.fill()

        // 核心：刚炸开的一瞬是白热，之后转为本身颜色
        ctx.globalAlpha = Math.min(1, a * 1.2)
        ctx.fillStyle = a > 0.88 ? '#ffffff' : col
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, TAU)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // 累计 1000 次以上，屏幕中上部显示一行字（带阴影，深浅背景都看得清）
      var shown = (total == null ? readCount() : total)
      if (shown >= st.textAt) {
        var alpha = Math.min(1, Math.max(0, 1 - elapsed / st.duration) * 2)
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
    log('礼花：' + waves + ' 波 × ' + perWave + ' 粒子（第 '
      + (total == null ? readCount() : total) + ' 次）')
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
      // 第一个参数传 0：强度完全由累计次数决定（strengthOf），不被里程碑级别覆盖，
      // 否则 500 次之后每一档都会被 floor 到同一个「级别"值，视觉上不再增长
      launch(0, n)
      try { window.localStorage.setItem(KEY_LAST, String(Date.now())) } catch (e) { }
    }
  }

  window.__plmEgg = {
    tick: tick,
    /** 只读当前累计次数（无日志、无副作用），供标题栏徽标显示 */
    count: function () { return readCount() },
    status: function () {
      var c = cfg()
      var n = readCount()
      log('累计 ' + n + ' 次｜每 ' + c.every + ' 次触发｜当前级别 ' + levelOf(n, c.milestones)
        + '｜开关 ' + (c.enabled ? '开' : '关'))
      return { count: n, every: c.every, level: levelOf(n, c.milestones), enabled: c.enabled, milestones: c.milestones }
    },
    test: function (lv) { launch(Number(lv == null ? 3 : lv), readCount()) },
    /**
     * 按「假设已累计 N 次」预览礼花强度（不改计数、不影响真实使用）
     * 演示页和现场调参用：__plmEgg.preview(1500) 就能看到 1500 次的样子
     */
    preview: function (total) { launch(0, Math.max(0, Number(total) || 0)) },
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
