import { httpFetch } from '../../request'
import { formatPlayTime } from '../../index'
import { signWbi, paramsToQuery } from './wbi'
import { log } from '../../log'

// 辅助函数：同时输出到控制台和日志文件
const biLog = {
  info(...msgs) {
    console.log(...msgs)
    log.info('[Bilibili]', ...msgs)
  },
  warn(...msgs) {
    console.warn(...msgs)
    log.warn('[Bilibili]', ...msgs)
  },
  error(...msgs) {
    console.error(...msgs)
    log.error('[Bilibili]', ...msgs)
  },
}

// 将秒数转换为 MM:SS 格式（用于处理字符串格式的时长）
function secToDuration(sec) {
  if (typeof sec !== 'number') {
    if (typeof sec === 'string') {
      // 如果已经是字符串格式，直接返回
      if (/^\d+:\d{2}$/.test(sec)) return sec
      // 尝试解析
      const dur = sec.split(':')
      if (dur.length >= 2) {
        const totalSec = dur.reduce((prev, curr) => 60 * prev + +curr, 0)
        return formatPlayTime(totalSec)
      }
    }
    return null
  }
  return formatPlayTime(sec)
}

const searchHeaders = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63',
  accept: 'application/json, text/plain, */*',
  'accept-encoding': 'gzip, deflate, br',
  origin: 'https://search.bilibili.com',
  'sec-fetch-site': 'same-site',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
  referer: 'https://search.bilibili.com/',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
}

let cookie = null

// 获取 Cookie - 添加重试和备选方案
async function getCookie() {
  if (cookie) {
    return cookie
  }
  
  try {
    const requestObj = httpFetch('https://api.bilibili.com/x/frontend/finger/spi', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/114.0.0.0',
      },
      timeout: 5000,
    })
    const resp = await requestObj.promise
    const data = resp.body?.data
    if (data?.b_3 && data?.b_4) {
      cookie = data
      biLog.info('成功获取B站Cookie')
      return cookie
    }
  } catch (error) {
    biLog.warn('获取Cookie失败:', error.message || error)
  }
  
  // 备选：使用默认值（某些情况下可能不需要Cookie也能搜索）
  biLog.warn('使用默认Cookie值（可能影响搜索功能）')
  cookie = { b_3: 'default_buvid3', b_4: 'default_buvid4' }
  return cookie
}

// 将时长转换为秒数（改进版，支持多种格式）
function durationToSec(duration) {
  if (typeof duration === 'number') {
    return duration
  }
  if (typeof duration === 'string') {
    // 处理 "48:28" 或 "1:48:28" 格式
    const parts = duration.split(':').map(part => parseInt(part) || 0)
    if (parts.length === 2) {
      // 分:秒 → 秒
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      // 时:分:秒 → 秒
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    // 尝试直接解析为数字
    const num = parseInt(duration)
    if (!isNaN(num)) return num
  }
  return 0
}

// 从 URL 或其他字段中提取 bvid 或 aid
function extractBvidOrAid(item) {
  // 参考 bb.js 的实现，直接使用 API 返回的字段
  // 优先使用已有的 bvid 或 aid（检查是否为有效值）
  let bvid = item.bvid
  let aid = item.aid

  // 规范化 bvid：确保是字符串且非空
  if (bvid != null) {
    const bvidStr = String(bvid).trim()
    if (bvidStr && /^BV[a-zA-Z0-9]+$/i.test(bvidStr)) {
      // 同时尝试规范化 aid（如果存在）
      let normalizedAid = null
      if (aid != null) {
        const aidStr = String(aid).trim()
        if (aidStr && /^\d+$/.test(aidStr)) {
          normalizedAid = aidStr
        }
      }
      return { bvid: bvidStr, aid: normalizedAid }
    }
  }

  // 规范化 aid：确保是字符串且非空
  if (aid != null) {
    const aidStr = String(aid).trim()
    if (aidStr && /^\d+$/.test(aidStr)) {
      return { bvid: null, aid: aidStr }
    }
  }

  // 尝试从 arcurl 或其他 URL 字段中提取
  const url = item.arcurl || item.url || item.link || ''
  if (url && typeof url === 'string') {
    // 匹配 BV 号: /video/BVxxxxxxxxxx 或 bilibili.com/video/BVxxxxxxxxxx
    const bvidMatch = url.match(/(?:bilibili\.com\/video\/|^\/video\/)(BV[a-zA-Z0-9]+)/i)
    if (bvidMatch && bvidMatch[1]) {
      const extractedBvid = bvidMatch[1]
      // 如果原数据中有 aid，也保留
      let normalizedAid = null
      if (aid != null) {
        const aidStr = String(aid).trim()
        if (aidStr && /^\d+$/.test(aidStr)) {
          normalizedAid = aidStr
        }
      }
      return { bvid: extractedBvid, aid: normalizedAid }
    }
    // 匹配 av 号: /video/av123456 或 bilibili.com/video/av123456
    const aidMatch = url.match(/(?:bilibili\.com\/video\/av|^\/video\/av)(\d+)/i)
    if (aidMatch && aidMatch[1]) {
      return { bvid: null, aid: aidMatch[1] }
    }
  }

  // 尝试从其他可能的字段提取
  // 某些 API 可能返回 video_id 或其他字段
  if (item.video_id != null) {
    const videoId = String(item.video_id).trim()
    // video_id 可能是 bvid 格式
    if (/^BV[a-zA-Z0-9]+$/i.test(videoId)) {
      // 如果原数据中有 aid，也保留
      let normalizedAid = null
      if (aid != null) {
        const aidStr = String(aid).trim()
        if (aidStr && /^\d+$/.test(aidStr)) {
          normalizedAid = aidStr
        }
      }
      return { bvid: videoId, aid: normalizedAid }
    }
    // 或者可能是 aid
    if (/^\d+$/.test(videoId)) {
      return { bvid: null, aid: videoId }
    }
  }

  // 如果都没有，返回 null
  return { bvid: null, aid: null }
}


export default {
  limit: 20,
  total: 0,
  page: 0,
  allPage: 1,

  async musicSearch(str, page, limit) {
    try {
      await getCookie()
      const pageSize = limit || this.limit

      // 优化后的搜索参数
      const params = {
        keyword: str,
        search_type: 'video',
        page: page,
        page_size: pageSize || 20,
        order: 'totalrank', // 默认排序规则：综合排序
        duration: 0, // 0=全部时长
        tids: 0, // 0=全部分区
        platform: 'web', // 使用web平台
        highlight: 1,
        single_column: 0,
      }

      const cookieStr = cookie ? `buvid3=${cookie.b_3};buvid4=${cookie.b_4}` : ''
      const headers = { ...searchHeaders }
      if (cookieStr) headers.cookie = cookieStr

      // 对搜索参数进行 WBI 签名
      let signedParams
      try {
        signedParams = await signWbi(params)
      } catch (error) {
        biLog.warn('WBI 签名失败，使用原始参数:', error.message)
        signedParams = params
      }

      // 构建查询字符串（注意：WBI 签名后的参数不需要再次排序，直接拼接即可）
      const searchUrl = `https://api.bilibili.com/x/web-interface/search/type?${paramsToQuery(signedParams)}`

      const requestObj = httpFetch(searchUrl, {
        method: 'GET',
        headers,
      })

      const resp = await requestObj.promise

      // 处理响应数据
      let bodyData = resp.body
      if (typeof bodyData === 'string') {
        try {
          bodyData = JSON.parse(bodyData)
        } catch (e) {
          biLog.error('解析响应 JSON 失败:', e)
          throw new Error('搜索失败：响应数据格式错误')
        }
      }

      // B站 API 返回格式: { code: 0, data: { result: [...], numResults: number } }
      if (bodyData?.code !== 0 && bodyData?.code !== undefined) {
        biLog.error('API 返回错误码:', bodyData.code, bodyData.message)
        throw new Error(`搜索失败：${bodyData.message || '未知错误'}`)
      }

      const resultData = bodyData?.data
      if (!resultData) {
        throw new Error('搜索失败：返回数据格式错误')
      }

      // result 可能是数组，也可能是对象（包含 vlist 等）
      let resultList = resultData.result
      if (!resultList) {
        throw new Error('搜索失败：搜索结果为空')
      }

      // 如果 result 是对象，尝试获取 vlist
      if (!Array.isArray(resultList)) {
        if (resultList.vlist && Array.isArray(resultList.vlist)) {
          resultList = resultList.vlist
        } else {
          throw new Error('搜索失败：搜索结果格式错误')
        }
      }

      return {
        result: resultList,
        numResults: resultData.numResults || resultList.length,
        page: resultData.page,
      }
    } catch (error) {
      biLog.error('musicSearch error:', error.message || error)
      throw error
    }
  },

  handleResult(rawList) {
    if (!rawList || !Array.isArray(rawList)) {
      biLog.warn('handleResult: rawList 不是有效数组')
      return []
    }

    const validResults = rawList
      .map((item, index) => {
        // 提取 bvid 或 aid
        const { bvid, aid } = extractBvidOrAid(item)
        
        // 更严格的验证：必须要有 bvid 或 aid
        if (!bvid && !aid) {
          if (index < 3) {
            biLog.warn('跳过无效结果（缺少有效标识）:', {
              title: item.title?.substring(0, 50),
              hasBvid: !!item.bvid,
              hasAid: !!item.aid,
              hasArcurl: !!item.arcurl,
            })
          }
          return null
        }

        // 清理标题中的HTML标签
        const title = item.title?.replace(/<[^>]*>/g, '') || '未知标题'
        const duration = durationToSec(item.duration)
        
        // 关键修复：不要使用CID作为musicId，使用BV号或AV号
        // 同一个视频的不同分P会有不同的CID，但BV号相同
        const musicId = bvid || aid
        if (!musicId) {
          biLog.warn('无法生成有效的musicId，跳过结果')
          return null
        }

        // 验证封面URL
        let coverUrl = item.pic
        if (coverUrl?.startsWith('//')) {
          coverUrl = `https:${coverUrl}`
        } else if (!coverUrl || !coverUrl.startsWith('http')) {
          coverUrl = null
        }

        // 验证作者信息
        const author = item.author || item.owner?.name || item.owner?.mid || '未知UP主'

        // 记录处理信息（前3个结果）
        if (index < 3) {
          biLog.info(`处理搜索结果 ${index + 1}:`, {
            title: title.substring(0, 30),
            bvid,
            aid,
            author,
            duration,
            hasCover: !!coverUrl,
            musicId,
          })
        }

        return {
          singer: author,
          name: title,
          source: 'bi',
          interval: secToDuration(duration),
          songmid: musicId, // 使用BV/AV号，不是CID
          img: coverUrl,
          types: [{ type: '128k', size: null }],
          _types: { '128k': {} },
          typeUrl: {},
          meta: {
            songId: musicId, // 存储主要标识（BV/AV号）
            albumName: title.substring(0, 20),
            picUrl: coverUrl,
            qualitys: [{ type: '128k', size: null }],
            _qualitys: { '128k': {} },
            // 确保标识字段正确
            ...(bvid ? { bvid } : {}),
            ...(aid ? { aid } : {}),
            // 注意：不在这里存储cid，播放时会重新获取
          },
        }
      })
      .filter(item => item !== null)

    biLog.info(`搜索结果处理完成: ${validResults.length}/${rawList.length} 有效`)
    return validResults
  },

  search(str, page = 1, limit, retryNum = 0) {
    if (++retryNum > 3) {
      biLog.error('搜索重试次数超限')
      return Promise.reject(new Error('搜索失败，请检查网络或关键词'))
    }
    
    if (limit == null) limit = this.limit
    
    return this.musicSearch(str, page, limit)
      .then((result) => {
        if (!result || !result.result) {
          throw new Error('搜索结果为空')
        }
        
        const list = this.handleResult(result.result)
        
        if (!list || list.length === 0) {
          biLog.warn(`第${page}页搜索结果为空，关键词: "${str}"`)
          if (retryNum < 3) {
            return this.search(str, page, limit, retryNum)
          }
          // 返回空结果而不是错误
          return {
            list: [],
            allPage: 1,
            limit: this.limit,
            total: 0,
            source: 'bi',
          }
        }

        this.total = result.numResults || list.length
        this.page = page
        this.allPage = Math.ceil(this.total / this.limit) || 1
        
        biLog.info(`搜索成功: "${str}" 第${page}页, 共${list.length}条结果`)
        
        return {
          list,
          allPage: this.allPage,
          limit: this.limit,
          total: this.total,
          source: 'bi',
        }
      })
      .catch((err) => {
        biLog.error(`搜索错误 (${retryNum}/3):`, err.message)
        if (retryNum < 3) {
          // 延迟重试
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(this.search(str, page, limit, retryNum))
            }, 1000 * retryNum)
          })
        }
        return Promise.reject(err)
      })
  },
}

