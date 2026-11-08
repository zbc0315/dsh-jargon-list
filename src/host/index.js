'use strict'

/**
 * @tom2012/dsh-jargon-list — Host 半入口
 *
 * 一个 JargonStore 同时喂两张嘴：
 *   · 同源路由 `/-/jargon/*`（浏览器里的右侧栏面板，复用宿主鉴权）
 *   · agent 工具 jargon_list / jargon_save / jargon_delete
 *
 * 这正是设计稿的核心约束：UI 与 agent 对同一份数据永远一致。
 * 数据落在 `<工作区>/.dsh/jargon.json`，跟着项目走。
 *
 * 可选服务一律用 ctx.inject 声明：宿主没有 webServer/connection 时插件仍能只用工具，
 * 没有 tools 时仍能只开面板，不会因为缺一个服务就整个不激活。
 */

const { JargonStore } = require('./store')
const { registerRoutes } = require('./routes')
const { registerTools } = require('./tools')

const name = 'jargon-list'

/** 硬依赖为空：两半各自用 ctx.inject 等待自己的服务。 */
const inject = []

/**
 * 插件入口。
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {object} [config]
 */
function apply(ctx, config) {
  // 无论插件自己出什么问题，都不许把异常抛回 Loader：一个插件坏掉不该影响宿主启动。
  // 真正的问题通过 warn 日志留痕，插件退化为“什么都不做”。
  try {
    const logger = typeof ctx.logger === 'function' ? ctx.logger(name) : null
    const warn = (message) => {
      try {
        if (logger && typeof logger.warn === 'function') logger.warn(message)
        else console.warn(`[dsh-jargon-list] ${message}`)
      } catch {
        /* 连日志都写不出去时保持安静 */
      }
    }

    const store = new JargonStore(config && config.store ? config.store : undefined)

    if (typeof ctx.inject !== 'function' || typeof ctx.effect !== 'function') {
      warn('宿主上下文缺少 inject/effect，黑话单未启用')
      return
    }

    // 浏览器半：没有 webServer/connection 的宿主（例如纯 CLI）就静默跳过这一半。
    ctx.inject(['webServer', 'connection'], (scope) => {
      try {
        scope.effect(() => registerRoutes(scope, store, { warn }), 'jargon-list: routes')
      } catch (error) {
        warn(`注册 HTTP 路由失败：${(error && error.message) || error}`)
      }
    })

    // agent 半：没有 tools 服务时同样跳过。
    ctx.inject(['tools'], (scope) => {
      try {
        registerTools(scope, store, { warn })
      } catch (error) {
        warn(`注册工具失败：${(error && error.message) || error}`)
      }
    })
  } catch (error) {
    try {
      console.warn(`[dsh-jargon-list] 插件启用失败（已忽略，不影响宿主）：${(error && error.message) || error}`)
    } catch {
      /* 什么都不做 */
    }
  }
}

module.exports = { name, inject, apply }
