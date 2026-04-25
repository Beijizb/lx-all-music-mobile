import { httpGet } from '@/utils/request'
import { name } from '../../package.json'
import { downloadFile, stopDownload, temporaryDirectoryPath } from '@/utils/fs'
import { getSupportedAbis, installApk } from '@/utils/nativeModules/utils'
import { APP_PROVIDER_NAME } from '@/config/constant'

const abis = ['arm64-v8a', 'armeabi-v7a', 'x86_64', 'x86', 'universal']

const repoOwner = 'Beijizb'
const repoName = 'lx-all-music-mobile'
const repoBranch = 'main'
const releaseAssetName = name
const rawVersionUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${repoBranch}/publish/version.json`
const githubVersionUrl = `https://github.com/${repoOwner}/${repoName}/raw/${repoBranch}/publish/version.json`
const githubReleaseUrl = (version, abi) =>
  `https://github.com/${repoOwner}/${repoName}/releases/download/v${version}/${releaseAssetName}-v${version}-${abi}.apk`
const proxyUrl = (proxy, url) => `${proxy}/${url}`

const address = [
  [proxyUrl('https://gh.bugdey.us.kg', rawVersionUrl), 'direct'],
  [proxyUrl('https://ghfile.geekertao.top', rawVersionUrl), 'direct'],
  [proxyUrl('https://github.dpik.top', rawVersionUrl), 'direct'],
  [rawVersionUrl, 'direct'],
  // ['https://registry.npmjs.org/lx-music-mobile-version-info/latest', 'npm'],
  [`https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}@${repoBranch}/publish/version.json`, 'direct'],
  [`https://fastly.jsdelivr.net/gh/${repoOwner}/${repoName}@${repoBranch}/publish/version.json`, 'direct'],
  [`https://gcore.jsdelivr.net/gh/${repoOwner}/${repoName}@${repoBranch}/publish/version.json`, 'direct'],
  [githubVersionUrl, 'direct'],
  // ['https://registry.npmmirror.com/lx-music-mobile-version-info/latest', 'npm'],
  // ['http://cdn.stsky.cn/lx-music/mobile/version.json', 'direct'],
]

const request = async (url, retryNum = 0) => {
  return new Promise((resolve, reject) => {
    httpGet(
      url,
      {
        timeout: 10000,
      },
      (err, resp, body) => {
        if (err || resp.statusCode != 200) {
          ++retryNum >= 3
            ? reject(err || new Error(resp.statusMessage || resp.statusCode))
            : request(url, retryNum).then(resolve).catch(reject)
        } else resolve(body)
      }
    )
  })
}

const getDirectInfo = async (url) => {
  return request(url).then((info) => {
    if (info.version == null) throw new Error('failed')
    return info
  })
}

const getNpmPkgInfo = async (url) => {
  return request(url).then((json) => {
    if (!json.versionInfo) throw new Error('failed')
    const info = JSON.parse(json.versionInfo)
    if (info.version == null) throw new Error('failed')
    return info
  })
}

export const getVersionInfo = async (index = 0) => {
  const [url, source] = address[index]
  let promise
  switch (source) {
    case 'direct':
      promise = getDirectInfo(url)
      break
    case 'npm':
      promise = getNpmPkgInfo(url)
      break
  }

  return promise.catch(async (err) => {
    index++
    if (index >= address.length) throw err
    return getVersionInfo(index)
  })
}

const getTargetAbi = async () => {
  const supportedAbis = await getSupportedAbis()
  for (const abi of abis) {
    if (supportedAbis.includes(abi)) return abi
  }
  return abis[abis.length - 1]
}
let downloadJobId = null
const noop = (total, download) => {}
let apkSavePath

export const downloadNewVersion = async (version, onDownload = noop) => {
  const abi = await getTargetAbi()
  const releaseUrl = githubReleaseUrl(version, abi)
  const urls = [
    proxyUrl('https://gh.bugdey.us.kg', releaseUrl),
    proxyUrl('https://ghfile.geekertao.top', releaseUrl),
    proxyUrl('https://github.dpik.top', releaseUrl),
    releaseUrl,
  ]
  let savePath = temporaryDirectoryPath + `/${releaseAssetName}.apk`

  const download = (index = 0) => {
    if (downloadJobId) stopDownload(downloadJobId)

    const { jobId, promise } = downloadFile(urls[index], savePath, {
      progressInterval: 500,
      connectionTimeout: 20000,
      readTimeout: 30000,
      begin({ contentLength }) {
        onDownload(contentLength, 0)
      },
      progress({ contentLength, bytesWritten }) {
        onDownload(contentLength, bytesWritten)
      },
    })
    downloadJobId = jobId
    return promise.catch((err) => {
      if (index + 1 >= urls.length) throw err
      return download(index + 1)
    })
  }

  return download().then(() => {
    apkSavePath = savePath
    return updateApp()
  })
}

export const updateApp = async () => {
  if (!apkSavePath) throw new Error('apk Save Path is null')
  await installApk(apkSavePath, APP_PROVIDER_NAME)
}
