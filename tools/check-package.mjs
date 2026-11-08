/**
 * 安装前的清单自检：包名、导出、bundle patch、dsh.client、locale、图标、产物。
 * 任一不符直接非零退出，避免装进去才发现元信息或入口是错的。
 *
 * 用法：node tools/check-package.mjs
 */

import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFile(join(root, rel), 'utf8')
const readJson = async (rel) => JSON.parse(await read(rel))

const manifest = await readJson('package.json')
const patch = await read('cordis.patch.yml')

assert.equal(manifest.name, '@tom2012/dsh-jargon-list', 'unexpected package name')
assert.equal(manifest.main, 'src/host/index.js', 'host entry must be src/host/index.js')
assert.equal(manifest.exports['.'], './src/host/index.js')
assert.equal(manifest.exports['./client'], './client/bundle.js')
assert.equal(manifest.exports['./icon'], './icon.svg')
assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
assert.equal(manifest.dsh.client.platform, 'web')
assert.equal(manifest.dsh.client.immediately, true)
assert.ok(
  manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-sidebar-right'),
  'client inject must order activation after the right sidebar',
)
assert.ok(!manifest.dependencies?.react, 'React must stay host-provided')
for (const file of ['src', 'client/bundle.js', 'locale', 'icon.svg', 'cordis.patch.yml']) {
  assert.ok(
    manifest.files.some((entry) => entry === file || entry.startsWith(`${file}/`)),
    `files must ship ${file}`,
  )
}

assert.match(patch, /id:\s*jargon-list/, 'patch must insert the jargon-list row')
assert.match(patch, /@tom2012\/dsh-jargon-list/, 'patch must name the package')

for (const locale of ['zh', 'en']) {
  const dict = await readJson(`locale/${locale}.json`)
  assert.ok(dict.meta?.title, `locale/${locale}.json needs meta.title`)
  assert.ok(dict.meta?.description, `locale/${locale}.json needs meta.description`)
}

const icon = await read('icon.svg')
assert.ok(icon.trimStart().startsWith('<svg'), 'icon.svg must be an SVG')
assert.ok(!/<image\b/i.test(icon), 'icon.svg must not embed bitmaps')
assert.ok(Buffer.byteLength(icon) < 256 * 1024, 'icon.svg must stay under 256 KiB')

for (const file of ['src/host/index.js', 'src/host/store.js', 'src/host/routes.js', 'src/host/tools.js']) {
  await access(join(root, file))
}

const bundle = await read('client/bundle.js')
assert.ok(bundle.includes('window.__ModuleLoader__.load'), 'client bundle must use the ModuleLoader protocol')
assert.ok(bundle.includes('@tom2012/dsh-jargon-list'), 'client bundle id must be the package name')
assert.ok(bundle.includes('sidebar.right.pane.tab'), 'client must register the right sidebar tab body')
assert.ok(!bundle.includes('dsh-client-ui-primitives'), 'client must not import Harness Client packages')

console.log('package manifest, patch, locale, icon and bundle: OK')
