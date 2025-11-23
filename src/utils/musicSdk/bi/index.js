import musicSearch from './musicSearch'
import { httpFetch } from '../../request'
import { signWbi, paramsToQuery } from './wbi'
import lyric from './lyric'
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

const playHeaders = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63',
  accept: '*/*',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
  referer: 'https://www.bilibili.com/',
  origin: 'https://www.bilibili.com',
}

/**
 * 安全的URL解析函数，兼容React Native环境
 * React Native的URL API可能未完全实现protocol、hostname等属性
 * 使用正则表达式作为降级方案
 * 
 * 此函数专门处理React Native环境中URL.protocol等属性未实现的情况
 * 即使URL构造函数成功，访问protocol等属性也可能抛出异常
 */
function safeParseUrl(url) {
  if (!url || typeof url !== 'string') {
    return null
  }

  // 首先尝试使用正则表达式解析（最安全的方式）
  // 这样可以避免任何URL API兼容性问题
  const protocol = getProtocol(url)
  const hostname = getHostname(url)
  const pathname = getPathname(url)
  const search = getSearch(url)

  const result = {
    protocol,
    hostname,
    pathname,
    search,
    href: url,
    searchParams: null,
  }

  // 尝试使用标准URL API获取searchParams（如果可用）
  // 但即使失败也不影响主要功能
  try {
    const urlObj = new URL(url)
    // 安全地尝试获取searchParams
    if (urlObj && typeof urlObj.searchParams !== 'undefined') {
      try {
        result.searchParams = urlObj.searchParams
      } catch (e) {
        // searchParams不可用，忽略
        result.searchParams = null
      }
    }
  } catch (error) {
    // URL构造函数失败，完全使用正则降级（这是正常的）
    // 不记录警告，因为我们已经有了降级方案
  }

  return result
}

/**
 * 使用正则表达式获取URL协议
 */
function getProtocol(url) {
  const match = url.match(/^(https?):/i)
  return match ? match[1] + ':' : 'https:'
}

/**
 * 使用正则表达式获取URL主机名
 */
function getHostname(url) {
  const match = url.match(/^https?:\/\/([^\/\?#]+)/i)
  return match ? match[1] : ''
}

/**
 * 使用正则表达式获取URL路径
 */
function getPathname(url) {
  const match = url.match(/^https?:\/\/[^\/]+(\/[^\?#]*)/i)
  return match ? match[1] : '/'
}

/**
 * 使用正则表达式获取URL查询字符串
 */
function getSearch(url) {
  const match = url.match(/\?([^#]*)/)
  return match ? '?' + match[1] : ''
}

// 获取音乐 URL
async function getMusicUrl(songInfo, type) {
  try {
    // 添加详细的调试信息
    biLog.info('getMusicUrl 接收到的 songInfo:', {
      id: songInfo.id,
      name: songInfo.name,
      source: songInfo.source,
      meta: songInfo.meta,
      metaKeys: songInfo.meta ? Object.keys(songInfo.meta) : [],
      fullSongInfo: JSON.stringify(songInfo, null, 2).substring(0, 500),
    })

    // 从 meta 中提取 bvid/aid，确保是有效的字符串
    const bvid = songInfo.meta?.bvid
    const aid = songInfo.meta?.aid
    const cid = songInfo.meta?.cid

    // 验证并规范化 bvid/aid
    const normalizeBvid = (val) => {
      if (!val) return null
      const str = String(val).trim()
      return str && /^BV[a-zA-Z0-9]+$/i.test(str) ? str : null
    }
    const normalizeAid = (val) => {
      if (!val) return null
      const str = String(val).trim()
      return str && /^\d+$/.test(str) ? str : null
    }

    let finalBvid = normalizeBvid(bvid)
    let finalAid = normalizeAid(aid)

    biLog.info('提取的标识信息:', { 
      bvid: finalBvid, 
      aid: finalAid, 
      cid,
      rawBvid: bvid,
      rawAid: aid,
    })

    // 如果 meta 中没有有效的值，尝试从其他字段获取
    if (!finalBvid && !finalAid && songInfo.id) {
      const idStr = String(songInfo.id).trim()
      // 检查是否是 BV 号
      if (/^BV[a-zA-Z0-9]+$/i.test(idStr)) {
        finalBvid = idStr
        biLog.info('从 id 字段提取到 bvid:', finalBvid)
      }
      // 检查是否是纯数字（可能是 aid）
      else if (/^\d+$/.test(idStr) && idStr.length > 5) {
        finalAid = idStr
        biLog.info('从 id 字段提取到 aid:', finalAid)
      }
    }

    // 尝试从 songId 字段获取
    if (!finalBvid && !finalAid && songInfo.meta?.songId) {
      const songId = String(songInfo.meta.songId).trim()
      if (/^BV[a-zA-Z0-9]+$/i.test(songId)) {
        finalBvid = songId
        biLog.info('从 songId 字段提取到 bvid:', finalBvid)
      } else if (/^\d+$/.test(songId) && songId.length > 5) {
        finalAid = songId
        biLog.info('从 songId 字段提取到 aid:', finalAid)
      }
    }

    if (!finalBvid && !finalAid) {
      biLog.error('所有尝试都失败，无法获取 bvid 或 aid:', {
        songInfoId: songInfo.id,
        metaBvid: bvid,
        metaAid: aid,
        metaSongId: songInfo.meta?.songId,
        metaKeys: songInfo.meta ? Object.keys(songInfo.meta) : [],
        fullMeta: songInfo.meta,
      })
      throw new Error('该视频缺少必要的标识信息（bvid 或 aid），无法播放。请尝试搜索其他视频。')
    }

    // 使用最终提取的值（确保是有效的字符串）
    const useBvid = finalBvid
    const useAid = finalAid

    // 如果没有 cid，先获取视频信息（参考 bilibili-api-ts 的 get_download_url 实现）
    // get_download_url 支持 page_index 或 cid，至少提供一个
    let finalCid = cid
    let pageIndex = null // 分 P 号，从 0 开始（参考 bilibili-api-ts）
    
    if (!finalCid) {
      const params = useBvid ? { bvid: useBvid } : { aid: useAid }
      
      // 对获取 cid 的参数进行 WBI 签名
      let signedParams
      try {
        signedParams = await signWbi(params)
      } catch (error) {
        biLog.warn('获取 cid 接口 WBI 签名失败，使用原始参数:', error.message)
        signedParams = params
      }
      
      // 确保 URL 正确构建，没有占位符
      const queryString = paramsToQuery(signedParams)
      const viewUrl = `https://api.bilibili.com/x/web-interface/view?${queryString}`
      
      biLog.info('获取视频信息请求 URL:', viewUrl)
      biLog.info('请求参数:', params)

      const requestObj = httpFetch(viewUrl, {
        method: 'GET',
        headers: playHeaders,
      })

      const resp = await requestObj.promise
      
      // 处理响应体
      let bodyData = resp.body
      if (typeof bodyData === 'string') {
        try {
          bodyData = JSON.parse(bodyData)
        } catch (e) {
          biLog.error('解析视频信息响应 JSON 失败:', e)
          throw new Error('响应数据格式错误')
        }
      }
      
      const data = bodyData?.data

      biLog.info('获取视频信息响应:', {
        statusCode: resp.statusCode,
        apiCode: bodyData?.code,
        hasData: !!data,
        hasPages: !!data?.pages,
        pagesLength: data?.pages?.length,
      })

      if (data && data.pages && data.pages.length > 0) {
        // 使用第一个分 P 的信息（参考 bilibili-api-ts：page_index 从 0 开始）
        finalCid = data.pages[0].cid
        pageIndex = 0 // 默认使用第一个分 P
        biLog.info('成功获取视频信息:', {
          cid: finalCid,
          pageIndex: pageIndex,
          totalPages: data.pages.length,
          title: data.title,
        })
      } else {
        biLog.error('无法获取视频信息，响应数据:', {
          body: resp.body,
          data: data,
          apiCode: bodyData?.code,
          apiMessage: bodyData?.message,
        })
        throw new Error('无法获取视频信息')
      }
    } else {
      biLog.info('使用已有的 cid:', finalCid)
      // 如果已有 cid，pageIndex 设为 null，让 API 自动处理
    }

    // 获取播放地址
    // 参考 MusicFree 插件：优先使用旧版 API（更简单，不需要 WBI 签名）
    // 参考 bilibili-api-ts 文档：get_download_url(page_index, cid, html5)
    // 需要 cid 或 page_index，至少提供一个
    
    // 方案1: 优先尝试旧版 API（参考 MusicFree 插件实现）
    // 旧版 API 更简单：只需要 bvid/aid、cid、fnval: 16，不需要 WBI 签名
    // 这样可以避免签名失败的问题，提高成功率
    biLog.info('优先尝试旧版 API（参考 MusicFree 插件，无需 WBI 签名）')
    const simpleParams = {
      ...(useBvid ? { bvid: useBvid } : { aid: useAid }),
      cid: finalCid,
      fnval: 16, // 请求 dash 格式（音视频分离）
    }
    
    const simplePlayUrl = `https://api.bilibili.com/x/player/playurl?${Object.keys(simpleParams)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(simpleParams[key])}`)
      .join('&')}`
    
    biLog.info('旧版 API 请求 URL:', simplePlayUrl)
    biLog.info('旧版 API 请求参数:', simpleParams)

    // 构建带 Referer 的 headers（参考 bilibili-api-ts）
    // 注意：如果需要获取720P及以上清晰度，需要添加 SESSDATA Cookie
    // 当前实现不强制要求Cookie，会自动降级到可用清晰度
    const requestHeaders = {
      ...playHeaders,
      referer: useBvid 
        ? `https://www.bilibili.com/video/${useBvid}`
        : `https://www.bilibili.com/video/av${useAid}`,
      // 如果需要支持用户登录Cookie，可以在这里添加：
      // cookie: userSessData ? `SESSDATA=${userSessData}` : undefined,
    }

    let url = null
    let data = null

    // 方案1: 尝试旧版 API（参考 MusicFree 插件）
    try {
      const simpleRequestObj = httpFetch(simplePlayUrl, {
        method: 'GET',
        headers: requestHeaders,
      })

      const simpleResp = await simpleRequestObj.promise
      
      // 检查响应状态码
      if (simpleResp.statusCode !== 200) {
        biLog.warn(`旧版 API 返回非 200 状态码: ${simpleResp.statusCode}`)
        throw new Error(`旧版 API 返回状态码: ${simpleResp.statusCode}`)
      }
      
      // 处理响应体
      let simpleBodyData = simpleResp.body
      if (typeof simpleBodyData === 'string') {
        try {
          simpleBodyData = JSON.parse(simpleBodyData)
        } catch (e) {
          biLog.warn('旧版 API 解析响应 JSON 失败:', e)
          throw new Error('旧版 API 响应数据格式错误')
        }
      }
      
      // 检查 API 返回的 code
      if (simpleBodyData?.code !== 0) {
        biLog.warn('旧版 API 返回错误码:', simpleBodyData?.code, simpleBodyData?.message)
        throw new Error(`旧版 API 返回错误: ${simpleBodyData?.message || '未知错误'}`)
      }

      const simpleData = simpleBodyData?.data

      biLog.info('旧版 API 响应:', {
        statusCode: simpleResp.statusCode,
        apiCode: simpleBodyData?.code,
        hasData: !!simpleData,
        hasDash: !!simpleData?.dash,
        hasDurl: !!simpleData?.durl,
        dashAudioLength: simpleData?.dash?.audio?.length,
        durlLength: simpleData?.durl?.length,
      })

      if (simpleData) {
        // 参考 MusicFree 插件：优先使用 dash.audio，按带宽排序选择音质
        if (simpleData.dash && simpleData.dash.audio && simpleData.dash.audio.length > 0) {
          const audios = simpleData.dash.audio
          // 参考 MusicFree：按带宽升序排序，但我们选择最高音质（降序）
          audios.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))
          const selectedAudio = audios[0]
          // 参考 MusicFree：使用 baseUrl（注意驼峰命名）
          let rawUrl = selectedAudio.baseUrl || selectedAudio.base_url ||
                (selectedAudio.backup_url && selectedAudio.backup_url[0]) ||
                (selectedAudio.backupUrl && selectedAudio.backupUrl[0])
          
          if (rawUrl) {
            try {
              url = decodeURIComponent(rawUrl)
              if (url !== rawUrl) {
                biLog.info('旧版 API URL 包含 Unicode 编码，已解码')
              }
            } catch (e) {
              biLog.warn('旧版 API URL Unicode 解码失败，使用原始 URL')
              url = rawUrl
            }
            
            // 验证URL格式
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
              biLog.warn('旧版 API 解码后的URL格式异常，尝试使用原始URL')
              url = rawUrl
            }
            
            biLog.info('旧版 API 成功获取播放地址（dash.audio）:', {
              bandwidth: selectedAudio.bandwidth,
              id: selectedAudio.id,
              codecs: selectedAudio.codecs,
              urlLength: url ? url.length : 0,
            })
          }
        } else if (simpleData.durl && simpleData.durl.length > 0) {
          // 参考 MusicFree：如果没有 dash，使用 durl
          let rawUrl = simpleData.durl[0].url || simpleData.durl[0].backup_url?.[0]
          if (rawUrl) {
            try {
              url = decodeURIComponent(rawUrl)
              if (url !== rawUrl) {
                biLog.info('旧版 API URL 包含 Unicode 编码，已解码')
              }
            } catch (e) {
              biLog.warn('旧版 API URL Unicode 解码失败，使用原始 URL')
              url = rawUrl
            }
            
            // 验证URL格式
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
              biLog.warn('旧版 API 解码后的URL格式异常，尝试使用原始URL')
              url = rawUrl
            }
            
            biLog.info('旧版 API 成功获取播放地址（durl）:', {
              urlLength: url ? url.length : 0,
              size: simpleData.durl[0].size,
            })
          }
        }
      }
      
      if (url) {
        // 旧版 API 成功，直接返回
        biLog.info('旧版 API 成功获取播放地址')
        data = simpleData
      } else {
        throw new Error('旧版 API 无可用 URL')
      }
    } catch (simpleError) {
      biLog.warn('旧版 API 失败，尝试新版 WBI API:', simpleError.message)
    }

    // 方案2: 如果旧版 API 失败，尝试新版 WBI API
    if (!url) {
      biLog.info('尝试使用新版 WBI API（需要签名）')
      const params = {
        ...(useBvid ? { bvid: useBvid } : { aid: useAid }),
        ...(finalCid ? { cid: finalCid } : {}), // 如果有 cid 则使用 cid
        ...(pageIndex !== null && !finalCid ? { page_index: pageIndex } : {}), // 如果没有 cid 且有 pageIndex 则使用 page_index
        fnval: 16, // 请求 dash 格式（音视频分离）
        fnver: 0, // 固定值
        fourk: 0, // 默认不支持4K（需要大会员），设为0可获取更多可用清晰度
        qn: 64, // 请求720P（如果无Cookie会自动降级到480P）
      }
      
      // 确保至少提供了 cid 或 page_index 之一
      if (!params.cid && pageIndex === null) {
        biLog.error('缺少必要参数：cid 和 page_index 都不存在')
        throw new Error('缺少必要参数：需要 cid 或 page_index')
      }

      // 对播放参数进行 WBI 签名
      let signedParams
      try {
        signedParams = await signWbi(params)
      } catch (error) {
        biLog.warn('播放接口 WBI 签名失败，使用原始参数:', error.message)
        signedParams = params
      }

      // 尝试使用 WBI 签名的 API
      const queryString = paramsToQuery(signedParams)
      let playUrl = `https://api.bilibili.com/x/player/wbi/playurl?${queryString}`

      biLog.info('新版 WBI API 请求 URL:', playUrl)
      biLog.info('新版 WBI API 请求参数:', params)

      try {
        const requestObj = httpFetch(playUrl, {
          method: 'GET',
          headers: requestHeaders,
        })

        const resp = await requestObj.promise
        
        // 检查响应状态码
        if (resp.statusCode !== 200) {
          biLog.warn(`新版 WBI API 返回非 200 状态码: ${resp.statusCode}`)
          throw new Error(`新版 WBI API 返回状态码: ${resp.statusCode}`)
        }
        
        // 处理响应体
        let bodyData = resp.body
        if (typeof bodyData === 'string') {
          try {
            bodyData = JSON.parse(bodyData)
          } catch (e) {
            biLog.warn('新版 WBI API 解析响应 JSON 失败:', e)
            throw new Error('新版 WBI API 响应数据格式错误')
          }
        }
        
        // 检查 API 返回的 code
        if (bodyData?.code !== 0 && bodyData?.code !== undefined) {
          biLog.warn('新版 WBI API 返回错误码:', bodyData.code, bodyData.message)
          const errorMsg = bodyData.message || '未知错误'
          // 检查是否是地区限制
          if (errorMsg.includes('地区') || errorMsg.includes('区域') || errorMsg.includes('地区限制') || 
              bodyData.code === -10403 || bodyData.code === -10404) {
            // 不立即抛出错误，继续尝试其他方法
            biLog.warn('检测到可能的地区限制，将尝试其他方法')
          } else {
            // 其他错误也继续尝试，不立即抛出
            biLog.warn('新版 WBI API 返回错误，将尝试其他方法:', errorMsg)
          }
          throw new Error(`新版 WBI API 失败: ${errorMsg}`)
        }
        
        data = bodyData?.data

        biLog.info('新版 WBI API 播放地址响应:', {
          statusCode: resp.statusCode,
          apiCode: bodyData?.code,
          hasData: !!data,
          hasDash: !!data?.dash,
          hasDurl: !!data?.durl,
          dashAudioLength: data?.dash?.audio?.length,
          durlLength: data?.durl?.length,
        })

        if (!data) {
          biLog.warn('新版 WBI API 响应数据为空，尝试其他方法')
          throw new Error('新版 WBI API 无数据')
        }

        // 优先使用 dash.audio（音视频分离格式，纯音频流）
        if (data.dash && data.dash.audio && data.dash.audio.length > 0) {
        const audios = data.dash.audio
        // 按带宽排序，选择合适音质（带宽越大音质越好）
        audios.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))
        const selectedAudio = audios[0]
        // 优先使用 base_url，如果没有则使用 backup_url 的第一个
        let rawUrl = selectedAudio.base_url || selectedAudio.baseUrl || 
              (selectedAudio.backup_url && selectedAudio.backup_url[0]) ||
              (selectedAudio.backupUrl && selectedAudio.backupUrl[0])
        
        // 处理 URL 中的 Unicode 转义符
        if (rawUrl) {
          try {
            // 先尝试解码，如果失败则使用原始URL
            url = decodeURIComponent(rawUrl)
            // 如果解码后的URL和原始URL不同，说明有编码
            if (url !== rawUrl) {
              biLog.info('URL 包含 Unicode 编码，已解码')
            }
          } catch (e) {
            // 如果解码失败，使用原始 URL
            biLog.warn('URL Unicode 解码失败，使用原始 URL')
            url = rawUrl
          }
          
          // 验证URL格式
          if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            biLog.warn('解码后的URL格式异常，尝试使用原始URL')
            url = rawUrl
          }
        }
        
          biLog.info('新版 WBI API 使用 dash.audio（纯音频流），选择音质:', {
            bandwidth: selectedAudio.bandwidth,
            id: selectedAudio.id,
            codecs: selectedAudio.codecs,
            hasUrl: !!url,
            urlLength: url ? url.length : 0,
          })
        }
        
        // 如果没有音频流，使用视频流（视频流也包含音频，音视频混合）
        if (!url && data.dash && data.dash.video && data.dash.video.length > 0) {
        const videos = data.dash.video
        // 按带宽排序，选择合适清晰度（带宽越大清晰度越好）
        videos.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))
        const selectedVideo = videos[0]
        // 优先使用 base_url，如果没有则使用 backup_url 的第一个
        let rawUrl = selectedVideo.base_url || selectedVideo.baseUrl ||
              (selectedVideo.backup_url && selectedVideo.backup_url[0]) ||
              (selectedVideo.backupUrl && selectedVideo.backupUrl[0])
        
        // 处理 URL 中的 Unicode 转义符
        if (rawUrl) {
          try {
            url = decodeURIComponent(rawUrl)
            if (url !== rawUrl) {
              biLog.info('URL 包含 Unicode 编码，已解码')
            }
          } catch (e) {
            biLog.warn('URL Unicode 解码失败，使用原始 URL')
            url = rawUrl
          }
          
          // 验证URL格式
          if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            biLog.warn('解码后的URL格式异常，尝试使用原始URL')
            url = rawUrl
          }
        }
        
          biLog.info('新版 WBI API 使用 dash.video（音视频混合流），选择清晰度:', {
            bandwidth: selectedVideo.bandwidth,
            id: selectedVideo.id,
            codecs: selectedVideo.codecs,
            width: selectedVideo.width,
            height: selectedVideo.height,
            hasUrl: !!url,
            urlLength: url ? url.length : 0,
          })
        }
        
        // 如果 DASH 格式都没有，降级使用 durl（FLV/MP4 格式，音视频混合）
        if (!url && data.durl && data.durl.length > 0) {
        const durlItem = data.durl[0]
        let rawUrl = durlItem.url || durlItem.backup_url?.[0]
        
        // 处理 URL 中的 Unicode 转义符
        if (rawUrl) {
          try {
            url = decodeURIComponent(rawUrl)
            if (url !== rawUrl) {
              biLog.info('URL 包含 Unicode 编码，已解码')
            }
          } catch (e) {
            biLog.warn('URL Unicode 解码失败，使用原始 URL')
            url = rawUrl
          }
          
          // 验证URL格式
          if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            biLog.warn('解码后的URL格式异常，尝试使用原始URL')
            url = rawUrl
          }
        }
        
          biLog.info('新版 WBI API 使用 durl 格式（MP4/FLV，音视频混合）:', {
            hasUrl: !!url,
            urlLength: url ? url.length : 0,
            size: durlItem.size,
          })
        }
        
        if (url) {
          biLog.info('新版 WBI API 成功获取播放地址')
        }
      } catch (wbiError) {
        biLog.warn('新版 WBI API 请求失败，尝试其他方法:', wbiError.message)
      }
    }

    // 如果标准 API 失败，尝试多个备用方案
    if (!url) {
      // 方案1: 尝试 HTML5 模式（参考 bilibili-api-ts 文档）
      // html5: 是否以 html5 平台访问，链接少但可以直接播放
      biLog.info('尝试使用 HTML5 模式获取播放地址')
      const html5Params = {
        ...(useBvid ? { bvid: useBvid } : { aid: useAid }),
        ...(finalCid ? { cid: finalCid } : {}), // 优先使用 cid
        ...(pageIndex !== null && !finalCid ? { page_index: pageIndex } : {}), // 如果没有 cid 则使用 page_index
        fnval: 16, // 请求 dash 格式
        fnver: 0,
        fourk: 0,
        qn: 16, // HTML5 模式使用较低清晰度，提高成功率
      }

      // HTML5 模式也尝试使用 WBI 签名
      let html5SignedParams
      try {
        html5SignedParams = await signWbi(html5Params)
      } catch (error) {
        biLog.warn('HTML5 模式 WBI 签名失败，使用原始参数:', error.message)
        html5SignedParams = html5Params
      }

      const html5QueryString = paramsToQuery(html5SignedParams)
      const html5PlayUrl = `https://api.bilibili.com/x/player/wbi/playurl?${html5QueryString}`

      try {
        const html5RequestObj = httpFetch(html5PlayUrl, {
          method: 'GET',
          headers: requestHeaders,
        })

        const html5Resp = await html5RequestObj.promise
        
        // 处理响应体
        let html5BodyData = html5Resp.body
        if (typeof html5BodyData === 'string') {
          try {
            html5BodyData = JSON.parse(html5BodyData)
          } catch (e) {
            biLog.warn('HTML5 模式解析响应 JSON 失败:', e)
            throw new Error('HTML5 模式响应数据格式错误')
          }
        }
        
        // 检查 API 返回的 code
        if (html5BodyData?.code !== 0 && html5BodyData?.code !== undefined) {
          biLog.warn('HTML5 模式 API 返回错误码:', html5BodyData.code, html5BodyData.message)
          throw new Error(`HTML5 模式 API 返回错误: ${html5BodyData.message || '未知错误'}`)
        }
        
        const html5Data = html5BodyData?.data

        biLog.info('HTML5 模式响应:', {
          statusCode: html5Resp.statusCode,
          apiCode: html5BodyData?.code,
          hasData: !!html5Data,
          hasDash: !!html5Data?.dash,
          hasDurl: !!html5Data?.durl,
        })

        if (html5Data) {
          // HTML5 模式优先使用音频流
          if (html5Data.dash && html5Data.dash.audio && html5Data.dash.audio.length > 0) {
            const audios = html5Data.dash.audio
            audios.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))
            const selectedAudio = audios[0]
            url = selectedAudio.base_url || selectedAudio.baseUrl ||
                  (selectedAudio.backup_url && selectedAudio.backup_url[0]) ||
                  (selectedAudio.backupUrl && selectedAudio.backupUrl[0])
            
            // 处理 URL 中的 Unicode 转义符
            if (url) {
              try {
                url = decodeURIComponent(url)
              } catch (e) {
                biLog.warn('HTML5 URL Unicode 解码失败，使用原始 URL')
              }
            }
            
            biLog.info('HTML5 模式使用 dash.audio（纯音频流），hasUrl:', !!url)
          }
          
          // 如果没有音频流，使用视频流（音视频混合）
          if (!url && html5Data.dash && html5Data.dash.video && html5Data.dash.video.length > 0) {
            const videos = html5Data.dash.video
            videos.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))
            const selectedVideo = videos[0]
            url = selectedVideo.base_url || selectedVideo.baseUrl ||
                  (selectedVideo.backup_url && selectedVideo.backup_url[0]) ||
                  (selectedVideo.backupUrl && selectedVideo.backupUrl[0])
            
            // 处理 URL 中的 Unicode 转义符
            if (url) {
              try {
                url = decodeURIComponent(url)
              } catch (e) {
                biLog.warn('HTML5 URL Unicode 解码失败，使用原始 URL')
              }
            }
            
            biLog.info('HTML5 模式使用 dash.video（音视频混合流），hasUrl:', !!url)
          }
          
          // 如果 DASH 格式都没有，使用 durl（MP4/FLV 格式，音视频混合）
          if (!url && html5Data.durl && html5Data.durl.length > 0) {
            const durlItem = html5Data.durl[0]
            url = durlItem.url || durlItem.backup_url?.[0]
            
            // 处理 URL 中的 Unicode 转义符
            if (url) {
              try {
                url = decodeURIComponent(url)
              } catch (e) {
                biLog.warn('HTML5 URL Unicode 解码失败，使用原始 URL')
              }
            }
            
            biLog.info('HTML5 模式使用 durl（MP4/FLV，音视频混合），hasUrl:', !!url)
          }
        }
      } catch (html5Error) {
        biLog.warn('HTML5 模式也失败:', html5Error.message)
      }

      // 方案2: 尝试旧版 API（不使用 WBI 签名，可能对某些视频有效）
      if (!url) {
        biLog.info('尝试使用旧版 API（无 WBI 签名）')
        const oldParams = {
          ...(useBvid ? { bvid: useBvid } : { aid: useAid }),
          cid: finalCid,
          fnval: 16,
          qn: 64,
        }
        const oldPlayUrl = `https://api.bilibili.com/x/player/playurl?${Object.keys(oldParams)
          .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(oldParams[key])}`)
          .join('&')}`

        try {
          const oldRequestObj = httpFetch(oldPlayUrl, {
            method: 'GET',
            headers: requestHeaders,
          })

          const oldResp = await oldRequestObj.promise
          
          // 检查响应状态码
          if (oldResp.statusCode !== 200) {
            throw new Error(`旧版 API 返回状态码: ${oldResp.statusCode}`)
          }
          
          let oldBodyData = oldResp.body
          if (typeof oldBodyData === 'string') {
            try {
              oldBodyData = JSON.parse(oldBodyData)
            } catch (e) {
              biLog.warn('旧版 API 解析响应 JSON 失败:', e)
              throw new Error('旧版 API 响应数据格式错误')
            }
          }

          // 检查 API 返回的 code
          if (oldBodyData?.code !== 0) {
            biLog.warn('旧版 API 返回错误码:', oldBodyData?.code, oldBodyData?.message)
            throw new Error(`旧版 API 返回错误: ${oldBodyData?.message || '未知错误'}`)
          }

          if (oldBodyData?.data) {
            const oldData = oldBodyData.data
            // 尝试提取 URL
            if (oldData.dash && oldData.dash.audio && oldData.dash.audio.length > 0) {
              const audios = oldData.dash.audio
              audios.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))
              const selectedAudio = audios[0]
              url = selectedAudio.base_url || selectedAudio.baseUrl ||
                    (selectedAudio.backup_url && selectedAudio.backup_url[0]) ||
                    (selectedAudio.backupUrl && selectedAudio.backupUrl[0])
              if (url) {
                try {
                  url = decodeURIComponent(url)
                } catch (e) {
                  // 忽略解码错误
                }
                biLog.info('旧版 API 成功获取播放地址')
              }
            } else if (oldData.durl && oldData.durl.length > 0) {
              url = oldData.durl[0].url || oldData.durl[0].backup_url?.[0]
              if (url) {
                try {
                  url = decodeURIComponent(url)
                } catch (e) {
                  // 忽略解码错误
                }
                biLog.info('旧版 API 成功获取播放地址（durl）')
              }
            }
          }
        } catch (oldError) {
          biLog.warn('旧版 API 也失败:', oldError.message)
        }
      }

      // 方案3: 尝试降低清晰度（可能绕过某些限制）
      if (!url) {
        biLog.info('尝试降低清晰度获取播放地址')
        const lowQnParams = {
          ...(useBvid ? { bvid: useBvid } : { aid: useAid }),
          cid: finalCid,
          fnval: 16,
          qn: 16, // 降低到 360P
        }

        let lowQnSignedParams
        try {
          lowQnSignedParams = await signWbi(lowQnParams)
        } catch (error) {
          lowQnSignedParams = lowQnParams
        }

        const lowQnQueryString = paramsToQuery(lowQnSignedParams)
        const lowQnPlayUrl = `https://api.bilibili.com/x/player/wbi/playurl?${lowQnQueryString}`

        try {
          const lowQnRequestObj = httpFetch(lowQnPlayUrl, {
            method: 'GET',
            headers: requestHeaders,
          })

          const lowQnResp = await lowQnRequestObj.promise
          
          // 检查响应状态码
          if (lowQnResp.statusCode !== 200) {
            throw new Error(`低清晰度模式返回状态码: ${lowQnResp.statusCode}`)
          }
          
          let lowQnBodyData = lowQnResp.body
          if (typeof lowQnBodyData === 'string') {
            try {
              lowQnBodyData = JSON.parse(lowQnBodyData)
            } catch (e) {
              biLog.warn('低清晰度模式解析响应 JSON 失败:', e)
              throw new Error('低清晰度模式响应数据格式错误')
            }
          }

          // 检查 API 返回的 code
          if (lowQnBodyData?.code !== 0) {
            biLog.warn('低清晰度模式返回错误码:', lowQnBodyData?.code, lowQnBodyData?.message)
            throw new Error(`低清晰度模式返回错误: ${lowQnBodyData?.message || '未知错误'}`)
          }

          if (lowQnBodyData?.data) {
            const lowQnData = lowQnBodyData.data
            if (lowQnData.dash && lowQnData.dash.audio && lowQnData.dash.audio.length > 0) {
              const audios = lowQnData.dash.audio
              audios.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))
              const selectedAudio = audios[0]
              url = selectedAudio.base_url || selectedAudio.baseUrl ||
                    (selectedAudio.backup_url && selectedAudio.backup_url[0]) ||
                    (selectedAudio.backupUrl && selectedAudio.backupUrl[0])
              if (url) {
                try {
                  url = decodeURIComponent(url)
                } catch (e) {
                  // 忽略解码错误
                }
                biLog.info('低清晰度模式成功获取播放地址')
              }
            } else if (lowQnData.durl && lowQnData.durl.length > 0) {
              url = lowQnData.durl[0].url || lowQnData.durl[0].backup_url?.[0]
              if (url) {
                try {
                  url = decodeURIComponent(url)
                } catch (e) {
                  // 忽略解码错误
                }
                biLog.info('低清晰度模式成功获取播放地址（durl）')
              }
            }
          }
        } catch (lowQnError) {
          biLog.warn('低清晰度模式也失败:', lowQnError.message)
        }
      }
    }

    if (!url) {
      // 检查是否是地区限制问题
      let errorMessage = '无法获取播放地址'
      let errorDetails = {
        hasData: !!data,
        hasDash: !!data?.dash,
        hasDashAudio: !!data?.dash?.audio,
        dashAudioLength: data?.dash?.audio?.length,
        hasDurl: !!data?.durl,
        durlLength: data?.durl?.length,
      }

      // 检查最后一次请求的错误信息
      if (data) {
        // 如果 API 返回了数据但没有可用的 URL，可能是地区限制或版权问题
        if (data.message) {
          errorMessage = `无法获取播放地址: ${data.message}`
          if (data.message.includes('地区') || data.message.includes('区域') || data.message.includes('地区限制')) {
            errorMessage = '该视频存在地区限制，可能需要使用特定地区的 IP 才能播放。请尝试使用日本或美国 IP 访问。'
          } else if (data.message.includes('版权') || data.message.includes('下架') || data.message.includes('不可用')) {
            errorMessage = '该视频因版权或其他原因无法播放，请尝试搜索其他视频。'
          }
        }
      }
      
      // 即使获取到了URL，如果播放失败，也可能是CDN地区限制
      // 这种情况：API返回成功，但CDN拒绝访问（需要特定IP）
      biLog.warn('所有方式都失败，可能的原因：', {
        note: '即使API返回成功，B站CDN也可能根据IP地址限制访问',
        suggestion: '如果播放失败，请尝试使用VPN切换到日本或美国IP',
        commonIssue: '某些B站视频的CDN有地区限制，需要特定地区的IP才能播放',
      })

      biLog.error('所有方式都失败，无法获取播放地址:', {
        ...errorDetails,
        fullData: data ? JSON.stringify(data).substring(0, 500) : 'null',
        bvid: useBvid,
        aid: useAid,
        cid: finalCid,
      })
      
      throw new Error(errorMessage)
    }

    // 验证并清理 URL
    if (url) {
      // 移除可能的控制字符和多余空格
      url = url.trim()
      
      // 检查 URL 格式
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        biLog.error('获取到的 URL 格式无效:', url.substring(0, 100))
        throw new Error('获取到的播放地址格式无效')
      }
      
      // B站播放URL可能需要特殊处理
      // 1. 确保URL中没有未编码的特殊字符
      // 2. 检查URL是否包含必要的参数
      // 使用安全的URL解析函数，兼容React Native环境
      const urlObj = safeParseUrl(url)
      
      if (urlObj) {
        // 安全地获取searchParams数量
        let searchParamsCount = 0
        try {
          if (urlObj.searchParams) {
            searchParamsCount = Array.from(urlObj.searchParams.keys()).length
          }
        } catch (e) {
          // searchParams不可用，忽略
          searchParamsCount = 0
        }

        biLog.info('URL 解析成功:', {
          protocol: urlObj.protocol,
          hostname: urlObj.hostname,
          pathname: urlObj.pathname ? urlObj.pathname.substring(0, 50) : '',
          hasSearch: urlObj.search ? urlObj.search.length > 0 : false,
          searchParamsCount,
        })
        
        // 检查是否是B站的CDN域名
        const isBiliCdn = urlObj.hostname && (
          urlObj.hostname.includes('bilivideo.com') || 
          urlObj.hostname.includes('biliapi.com') ||
          urlObj.hostname.includes('bilibili.com')
        )
        
        if (!isBiliCdn) {
          biLog.warn('URL 不是B站CDN域名，可能无法播放:', urlObj.hostname)
        }
        
        // 记录完整的URL信息（用于排查问题）
        // 注意：记录完整URL的前200个字符和后50个字符，便于排查问题
        const urlPreview = url.length > 250 
          ? url.substring(0, 200) + '...' + url.substring(url.length - 50)
          : url
        
        // 记录完整的URL（用于排查播放失败问题）
        // 如果播放失败，可以手动测试这个URL是否真的可以访问
        biLog.info('成功获取播放地址（完整URL）:', url)
        
        biLog.info('成功获取播放地址（详细信息）:', {
          urlLength: url.length,
          urlPreview: urlPreview,
          hostname: urlObj.hostname,
          pathname: urlObj.pathname,
          hasQueryParams: url.includes('?'),
          queryParams: urlObj.search,
          timestamp: new Date().toISOString(),
          isBiliCdn: isBiliCdn,
          // 重要提示：
          // 1. B站播放URL可能需要Referer header，但TrackPlayer只支持userAgent
          // 2. B站CDN可能有地区限制，某些视频需要特定地区的IP才能播放（如日本、美国IP）
          // 如果播放失败，可能是这两个原因之一
          note: 'B站播放URL可能需要Referer header或特定地区IP',
          suggestion: '如果播放失败，请尝试：1) 使用VPN切换到日本或美国IP；2) 在浏览器中测试URL是否可访问',
        })
      } else {
        biLog.warn('URL 解析失败，但继续使用原始URL')
        biLog.info('成功获取播放地址（未解析）:', {
          urlLength: url.length,
          urlPrefix: url.substring(0, 80) + '...',
          hasQueryParams: url.includes('?'),
          timestamp: new Date().toISOString(),
        })
      }
    } else {
      biLog.error('获取到的 URL 为空')
      throw new Error('获取到的播放地址为空')
    }
    
    // 返回 URL（移动端可能需要特殊处理 headers）
    // 注意：B站播放URL可能需要 Referer，但 TrackPlayer 只支持 userAgent
    // 如果播放失败，系统会自动重试2次刷新URL
    // 如果仍然失败，可能是：
    // 1. URL需要Referer header（TrackPlayer不支持）
    // 2. URL有时效性，已过期
    // 3. 网络问题或地区限制
    biLog.info('准备返回播放URL，如果播放失败将自动重试')
    return url
  } catch (error) {
    biLog.error('getMusicUrl error:', error.message || error)
    throw error
  }
}

const bi = {
  musicSearch,
  getMusicUrl(songInfo, type) {
    return {
      promise: getMusicUrl(songInfo, type).then((url) => {
        return { type, url }
      }),
      canceleFn() {
        // 取消请求（如果需要）
      },
    }
  },
  getLyric: lyric.getLyric,
  getMusicDetailPageUrl(songInfo) {
    const bvid = songInfo.meta?.bvid
    const aid = songInfo.meta?.aid
    if (bvid) {
      return `https://www.bilibili.com/video/${bvid}`
    } else if (aid) {
      return `https://www.bilibili.com/video/av${aid}`
    }
    return null
  },
}

export default bi

