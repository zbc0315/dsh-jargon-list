/**
 * 把本地 git 历史通过 GitHub Git Data API 落到远端仓库。
 *
 * 为什么：这台机器到 github.com:443 的 git 通道被挡（TLS 能握手但拿不到响应），
 * 而 api.github.com 正常，gh 也已有 repo scope 的 token。于是用 REST 逐个上传
 * blob / tree / commit，最后建 ref —— 历史与本地逐字节一致（用 tree sha 对拍验证）。
 *
 * 用法：node push-via-api.mjs <owner/repo> <token>
 * 安全：token 只走 Authorization 头，不打印。
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const [repo, token] = process.argv.slice(2)
if (!repo || !token) throw new Error('usage: node push-via-api.mjs <owner/repo> <token>')
const API = 'https://api.github.com'
const headers = {
  authorization: `Bearer ${token}`,
  accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28',
  'content-type': 'application/json',
  'user-agent': 'jargon-list-publisher',
}

let calls = 0
async function api(method, path, body) {
  calls += 1
  const res = await fetch(`${API}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    /* 非 JSON */
  }
  if (!res.ok) {
    const message = json && (json.message || JSON.stringify(json).slice(0, 300))
    throw new Error(`${method} ${path} -> ${res.status} ${message}`)
  }
  return json
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const gitBuf = (...args) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 })

/** 读全部提交（旧→新），含作者/提交者/时间/完整消息。 */
function readCommits() {
  const log = git('log', '--reverse', '--format=%H%x1f%P%x1f%an%x1f%ae%x1f%aI%x1f%cn%x1f%ce%x1f%cI%x1f%B%x1e')
  return log
    .split('\x1e')
    .map((chunk) => chunk.replace(/^\n/, ''))
    .filter((chunk) => chunk.trim() !== '')
    .map((chunk) => {
      const [sha, parents, an, ae, aI, cn, ce, cI, message] = chunk.split('\x1f')
      return { sha, parents: parents ? parents.split(' ') : [], an, ae, aI: aI.trim(), cn, ce, cI: cI.trim(), message }
    })
}

/** 读某个提交的完整文件树：[{ path, mode, type, sha }]。 */
function readTree(commit) {
  const out = git('ls-tree', '-r', commit)
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf('\t')
      const [mode, type, sha] = line.slice(0, tab).split(' ')
      return { path: line.slice(tab + 1), mode, type, sha }
    })
}

const blobCache = new Map()
async function uploadBlob(sha) {
  if (blobCache.has(sha)) return blobCache.get(sha)
  const content = gitBuf('cat-file', 'blob', sha).toString('base64')
  const created = await api('POST', `/repos/${repo}/git/blobs`, { content, encoding: 'base64' })
  blobCache.set(sha, created.sha)
  return created.sha
}

/** 空仓库不接受 Git Data API 的 blob；先用 Contents API 造一个占位提交，最后把 ref 指向真实历史。 */
async function ensureBranch() {
  const res = await fetch(`${API}/repos/${repo}/git/ref/heads/main`, { headers })
  if (res.ok) return false
  await api('PUT', `/repos/${repo}/contents/.gitignore`, {
    message: 'chore: initialize repository',
    content: Buffer.from('.DS_Store\nnode_modules/\n').toString('base64'),
  })
  console.log('initialized an empty repository with a placeholder commit')
  return true
}

async function main() {
  const initialized = await ensureBranch()
  const commits = readCommits()
  console.log(`commits: ${commits.length}`)

  const shaMap = new Map() // local commit sha -> remote commit sha
  const treeMismatch = []

  for (const [index, commit] of commits.entries()) {
    const entries = readTree(commit.sha)
    const treeEntries = []
    for (const entry of entries) {
      if (entry.type !== 'blob') throw new Error(`unsupported tree entry type ${entry.type} at ${entry.path}`)
      treeEntries.push({ path: entry.path, mode: entry.mode, type: 'blob', sha: await uploadBlob(entry.sha) })
    }
    const tree = await api('POST', `/repos/${repo}/git/trees`, { tree: treeEntries })

    const localTree = git('rev-parse', `${commit.sha}^{tree}`).trim()
    if (tree.sha !== localTree) treeMismatch.push({ commit: commit.sha, local: localTree, remote: tree.sha })

    const parents = commit.parents.map((parent) => shaMap.get(parent)).filter(Boolean)
    const created = await api('POST', `/repos/${repo}/git/commits`, {
      message: commit.message,
      tree: tree.sha,
      parents,
      author: { name: commit.an, email: commit.ae, date: commit.aI },
      committer: { name: commit.cn, email: commit.ce, date: commit.cI },
    })
    shaMap.set(commit.sha, created.sha)
    console.log(`  [${index + 1}/${commits.length}] ${commit.sha.slice(0, 8)} -> ${created.sha.slice(0, 8)} tree ${tree.sha === localTree ? 'match' : 'MISMATCH'} · ${commit.message.split('\n')[0].slice(0, 60)}`)
  }

  const headRemote = shaMap.get(commits[commits.length - 1].sha)
  if (initialized) {
    // 占位提交只是为了让空仓库有分支；历史建好后直接把 main 指到真实 HEAD。
    await api('PATCH', `/repos/${repo}/git/refs/heads/main`, { sha: headRemote, force: true })
  } else {
    await api('POST', `/repos/${repo}/git/refs`, { ref: 'refs/heads/main', sha: headRemote })
  }
  await api('PATCH', `/repos/${repo}`, { default_branch: 'main' })

  // 注解 tag：指向本地 tag 对象的那个提交，消息沿用本地 tag 的注释
  const tagName = git('describe', '--tags', '--abbrev=0', 'HEAD').trim()
  const tagTargetLocal = git('rev-list', '-n', '1', tagName).trim()
  const tagMessage = git('tag', '-l', '--format=%(contents)', tagName).trim()
  const tagTarget = shaMap.get(tagTargetLocal)
  if (tagTarget) {
    const tagObject = await api('POST', `/repos/${repo}/git/tags`, {
      tag: tagName,
      message: tagMessage || tagName,
      object: tagTarget,
      type: 'commit',
      tagger: {
        name: git('log', '-1', '--format=%cn', tagTargetLocal).trim(),
        email: git('log', '-1', '--format=%ce', tagTargetLocal).trim(),
        date: git('log', '-1', '--format=%cI', tagTargetLocal).trim(),
      },
    })
    await api('POST', `/repos/${repo}/git/refs`, { ref: `refs/tags/${tagName}`, sha: tagObject.sha })
    console.log(`tag ${tagName} -> ${tagTarget.slice(0, 8)}`)
  } else {
    console.log(`tag ${tagName}: 目标提交不在历史里，跳过`)
  }

  console.log(`API calls: ${calls}`)
  console.log(`tree mismatches: ${treeMismatch.length}`)
  if (treeMismatch.length) console.log(JSON.stringify(treeMismatch, null, 1))
  console.log(`remote head: ${headRemote}`)
}

await main()
