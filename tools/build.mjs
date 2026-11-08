/**
 * @tom2012/dsh-jargon-list — Client 构建
 *
 * DSH Web 的插件客户端是**单个 classic script**：`window.__ModuleLoader__.load({ id, factory })`，
 * factory 拿到的 `require` 只解析宿主模块表（react / react-dom / react/jsx-runtime 等），
 * 不解析相对路径。所以多文件源码必须打成一个自包含的单文件。
 *
 * 这里只做一件事：src/client/index.js → client/bundle.js（包成 ModuleLoader 协议）。
 *
 * 用法：node tools/build.mjs [--no-minify]
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, '..')
const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'))

const entry = join(pkgRoot, 'src', 'client', 'index.js')
const outDir = join(pkgRoot, 'client')
const outFile = join(outDir, 'bundle.js')
const minify = !process.argv.includes('--no-minify')

/** 宿主模块表提供的模块：不打包，运行时注入。 */
const EXTERNAL = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client']

function indent(code) {
  return code
    .split('\n')
    .map((line) => (line.length === 0 ? line : '    ' + line))
    .join('\n')
}

const result = await build({
  entryPoints: [entry],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  jsx: 'automatic',
  loader: { '.js': 'jsx' },
  external: EXTERNAL,
  minify,
  legalComments: 'none',
  charset: 'utf8',
  logLevel: 'warning',
  define: { 'process.env.NODE_ENV': '"production"' },
})

const code = result.outputFiles[0].text
const wrapped = `/* 由 tools/build.mjs 从 src/client/index.js 生成 —— 请勿手改；重新生成：npm run build */
window.__ModuleLoader__.load({
  id: ${JSON.stringify(pkg.name)},
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" })
${indent(code)}
    return module.exports
  }
})
`

mkdirSync(outDir, { recursive: true })
writeFileSync(outFile, wrapped, 'utf8')

const bytes = Buffer.byteLength(wrapped)
console.log(`built client/bundle.js (${(bytes / 1024).toFixed(1)} KB)${minify ? ' [minified]' : ' [readable]'}`)
