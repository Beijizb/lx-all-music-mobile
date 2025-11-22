import { httpFetch } from '../../request'
import { toMD5 } from '../utils'

// WBI 签名重排映射表
const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
  61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
  36, 20, 34, 44, 52,
]

// 缓存 WBI keys，避免频繁请求
let wbiKeysCache = {
  img_key: null,
  sub_key: null,
  expireTime: 0,
}

// WBI keys 缓存时间（24小时，单位：毫秒）
const CACHE_DURATION = 24 * 60 * 60 * 1000

/**
 * 对 imgKey 和 subKey 进行字符顺序打乱编码，生成 mixin_key
 * @param {string} orig - img_key + sub_key 拼接的字符串
 * @returns {string} mixin_key（前32位）
 */
function getMixinKey(orig) {
  return MIXIN_KEY_ENC_TAB.map((n) => orig[n]).join('').slice(0, 32)
}

/**
 * 获取 WBI keys（img_key 和 sub_key）
 * @returns {Promise<{img_key: string, sub_key: string}>}
 */
async function getWbiKeys() {
  const now = Date.now()
  
  // 检查缓存是否有效
  if (
    wbiKeysCache.img_key &&
    wbiKeysCache.sub_key &&
    now < wbiKeysCache.expireTime
  ) {
    return {
      img_key: wbiKeysCache.img_key,
      sub_key: wbiKeysCache.sub_key,
    }
  }

  try {
    const requestObj = httpFetch('https://api.bilibili.com/x/web-interface/nav', {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63',
        Referer: 'https://www.bilibili.com/',
      },
    })

    const resp = await requestObj.promise
    const bodyData = resp.body

    let data
    if (typeof bodyData === 'string') {
      try {
        data = JSON.parse(bodyData)
      } catch (e) {
        throw new Error('解析 nav 接口响应失败')
      }
    } else {
      data = bodyData
    }

    if (data?.code !== 0) {
      throw new Error(`获取 WBI keys 失败: ${data?.message || '未知错误'}`)
    }

    const imgUrl = data?.data?.wbi_img?.img_url
    const subUrl = data?.data?.wbi_img?.sub_url

    if (!imgUrl || !subUrl) {
      throw new Error('WBI keys 数据格式错误')
    }

    // 从 URL 中提取文件名（去掉路径和扩展名）
    const imgKey = imgUrl.slice(imgUrl.lastIndexOf('/') + 1, imgUrl.lastIndexOf('.'))
    const subKey = subUrl.slice(subUrl.lastIndexOf('/') + 1, subUrl.lastIndexOf('.'))

    if (!imgKey || !subKey) {
      throw new Error('无法从 URL 中提取 WBI keys')
    }

    // 更新缓存
    wbiKeysCache = {
      img_key: imgKey,
      sub_key: subKey,
      expireTime: now + CACHE_DURATION,
    }

    return {
      img_key: imgKey,
      sub_key: subKey,
    }
  } catch (error) {
    console.error('[Bilibili] 获取 WBI keys 失败:', error.message || error)
    // 如果获取失败，尝试使用缓存的 keys（即使已过期）
    if (wbiKeysCache.img_key && wbiKeysCache.sub_key) {
      console.warn('[Bilibili] 使用过期的 WBI keys 缓存')
      return {
        img_key: wbiKeysCache.img_key,
        sub_key: wbiKeysCache.sub_key,
      }
    }
    throw error
  }
}

/**
 * 为请求参数进行 WBI 签名
 * @param {Object} params - 原始请求参数
 * @param {string} img_key - WBI img_key
 * @param {string} sub_key - WBI sub_key
 * @returns {Object} 添加了 w_rid 和 wts 的签名参数
 */
function encWbi(params, img_key, sub_key) {
  // 生成 mixin_key
  const mixin_key = getMixinKey(img_key + sub_key)

  // 添加 wts 字段（当前 Unix 时间戳，秒）
  const curr_time = Math.round(Date.now() / 1000)
  
  // 过滤 value 中的 "!'()*" 字符，并创建新的参数对象
  const chr_filter = /[!'()*]/g
  const signedParams = {}
  
  // 先处理原始参数，过滤特殊字符
  for (const key in params) {
    const value = String(params[key]).replace(chr_filter, '')
    signedParams[key] = value
  }
  
  // 添加 wts
  signedParams.wts = curr_time

  // 按照 key 升序排序，构建查询字符串用于签名计算
  const sortedKeys = Object.keys(signedParams).sort()
  const query = sortedKeys
    .map((key) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(signedParams[key])}`
    })
    .join('&')

  // 计算 w_rid（MD5(query + mixin_key)）
  const w_rid = toMD5(query + mixin_key)

  // 添加 w_rid 到参数中
  signedParams.w_rid = w_rid

  return signedParams
}

/**
 * 为请求参数进行 WBI 签名（自动获取 keys）
 * @param {Object} params - 原始请求参数
 * @returns {Promise<Object>} 添加了 w_rid 和 wts 的签名参数
 */
export async function signWbi(params) {
  try {
    const { img_key, sub_key } = await getWbiKeys()
    return encWbi(params, img_key, sub_key)
  } catch (error) {
    console.error('[Bilibili] WBI 签名失败:', error.message || error)
    // 如果签名失败，返回原始参数（某些接口可能不需要签名）
    return params
  }
}

/**
 * 将签名后的参数转换为 URL query 字符串
 * @param {Object} params - 签名后的参数对象
 * @returns {string} URL query 字符串
 */
export function paramsToQuery(params) {
  return Object.keys(params)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
}

/**
 * 清除 WBI keys 缓存（用于强制刷新）
 */
export function clearWbiCache() {
  wbiKeysCache = {
    img_key: null,
    sub_key: null,
    expireTime: 0,
  }
}

