import musicSearch from './musicSearch'
import { httpFetch } from '../../request'

const playHeaders = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63',
  accept: '*/*',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
  referer: 'https://www.bilibili.com/',
  origin: 'https://www.bilibili.com',
}

// 获取音乐 URL
async function getMusicUrl(songInfo, type) {
  try {
    // 添加详细的调试信息
    console.log('[Bilibili] getMusicUrl 接收到的 songInfo:', {
      id: songInfo.id,
      name: songInfo.name,
      source: songInfo.source,
      meta: songInfo.meta,
      metaKeys: songInfo.meta ? Object.keys(songInfo.meta) : [],
      fullSongInfo: JSON.stringify(songInfo, null, 2).substring(0, 500),
    })

    const bvid = songInfo.meta?.bvid
    const aid = songInfo.meta?.aid
    const cid = songInfo.meta?.cid

    console.log('[Bilibili] 提取的标识信息:', { bvid, aid, cid })

    // 如果 meta 中没有，尝试从其他字段获取
    let finalBvid = bvid
    let finalAid = aid

    // 尝试从 id 字段提取（某些情况下 id 可能就是 bvid 或 aid）
    if (!finalBvid && !finalAid && songInfo.id) {
      const idStr = String(songInfo.id)
      // 检查是否是 BV 号
      if (/^BV[a-zA-Z0-9]+$/i.test(idStr)) {
        finalBvid = idStr
        console.log('[Bilibili] 从 id 字段提取到 bvid:', finalBvid)
      }
      // 检查是否是纯数字（可能是 aid）
      else if (/^\d+$/.test(idStr) && idStr.length > 5) {
        finalAid = idStr
        console.log('[Bilibili] 从 id 字段提取到 aid:', finalAid)
      }
    }

    // 尝试从 songId 字段获取
    if (!finalBvid && !finalAid && songInfo.meta?.songId) {
      const songId = String(songInfo.meta.songId)
      if (/^BV[a-zA-Z0-9]+$/i.test(songId)) {
        finalBvid = songId
        console.log('[Bilibili] 从 songId 字段提取到 bvid:', finalBvid)
      } else if (/^\d+$/.test(songId) && songId.length > 5) {
        finalAid = songId
        console.log('[Bilibili] 从 songId 字段提取到 aid:', finalAid)
      }
    }

    if (!finalBvid && !finalAid) {
      console.error('[Bilibili] 所有尝试都失败，无法获取 bvid 或 aid:', {
        songInfoId: songInfo.id,
        metaBvid: bvid,
        metaAid: aid,
        metaSongId: songInfo.meta?.songId,
        metaKeys: songInfo.meta ? Object.keys(songInfo.meta) : [],
      })
      throw new Error('该视频缺少必要的标识信息（bvid 或 aid），无法播放。请尝试搜索其他视频。')
    }

    // 使用最终提取的值
    const useBvid = finalBvid || bvid
    const useAid = finalAid || aid

    // 如果没有 cid，先获取
    let finalCid = cid
    if (!finalCid) {
      const params = useBvid ? { bvid: useBvid } : { aid: useAid }
      // 确保 URL 正确构建，没有占位符
      const queryString = Object.keys(params)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&')
      const viewUrl = `https://api.bilibili.com/x/web-interface/view?${queryString}`
      
      console.log('[Bilibili] 获取 cid 请求 URL:', viewUrl)
      console.log('[Bilibili] 请求参数:', params)

      const requestObj = httpFetch(viewUrl, {
        method: 'GET',
        headers: playHeaders,
      })

      const resp = await requestObj.promise
      const data = resp.body?.data

      console.log('[Bilibili] 获取 cid 响应:', {
        statusCode: resp.statusCode,
        hasData: !!data,
        hasPages: !!data?.pages,
        pagesLength: data?.pages?.length,
      })

      if (data && data.pages && data.pages.length > 0) {
        finalCid = data.pages[0].cid
        console.log('[Bilibili] 成功获取 cid:', finalCid)
      } else {
        console.error('[Bilibili] 无法获取 cid，响应数据:', {
          body: resp.body,
          data: data,
        })
        throw new Error('无法获取 cid')
      }
    } else {
      console.log('[Bilibili] 使用已有的 cid:', finalCid)
    }

    // 获取播放地址
    // 参考 bilibili-api-ts 文档：get_download_url(page_index, cid, html5)
    // 需要 cid 或 page_index，至少提供一个
    // html5: 是否以 html5 平台访问，链接少但可以直接播放
    
    // 首先尝试使用标准 API（dash 格式，音视频分离）
    const params = {
      ...(useBvid ? { bvid: useBvid } : { aid: useAid }),
      cid: finalCid,
      fnval: 16, // 请求 dash 格式（音视频分离）
      fnver: 0, // 固定值
      fourk: 1, // 支持 4K
    }

    const queryString = Object.keys(params)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    const playUrl = `https://api.bilibili.com/x/player/playurl?${queryString}`

    console.log('[Bilibili] 请求播放地址 URL:', playUrl)
    console.log('[Bilibili] 请求参数:', params)

    // 构建带 Referer 的 headers（参考 bilibili-api-ts）
    const requestHeaders = {
      ...playHeaders,
      referer: useBvid 
        ? `https://www.bilibili.com/video/${useBvid}`
        : `https://www.bilibili.com/video/av${useAid}`,
    }

    let url = null
    let data = null

    try {
      const requestObj = httpFetch(playUrl, {
        method: 'GET',
        headers: requestHeaders,
      })

      const resp = await requestObj.promise
      data = resp.body?.data

      console.log('[Bilibili] 播放地址响应:', {
        statusCode: resp.statusCode,
        hasData: !!data,
        hasDash: !!data?.dash,
        hasDurl: !!data?.durl,
        dashAudioLength: data?.dash?.audio?.length,
        durlLength: data?.durl?.length,
      })

      if (!data) {
        console.warn('[Bilibili] 标准 API 响应数据为空，尝试 HTML5 模式')
        throw new Error('标准 API 无数据')
      }

      // 优先使用 dash.audio（音视频分离格式）
      if (data.dash && data.dash.audio && data.dash.audio.length > 0) {
        const audios = data.dash.audio
        // 按带宽排序，选择合适音质（带宽越大音质越好）
        audios.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))
        url = audios[0].base_url || audios[0].backup_url?.[0]
        console.log('[Bilibili] 使用 dash.audio，选择音质:', {
          bandwidth: audios[0].bandwidth,
          id: audios[0].id,
          codecs: audios[0].codecs,
        })
      } else if (data.durl && data.durl.length > 0) {
        // 降级使用 durl（FLV/MP4 格式）
        url = data.durl[0].url
        console.log('[Bilibili] 使用 durl 格式')
      }
    } catch (error) {
      console.warn('[Bilibili] 标准 API 请求失败，尝试 HTML5 模式:', error.message)
    }

    // 如果标准 API 失败，尝试 HTML5 模式（参考 bilibili-api-ts 文档）
    if (!url) {
      console.log('[Bilibili] 尝试使用 HTML5 模式获取播放地址')
      const html5Params = {
        ...(useBvid ? { bvid: useBvid } : { aid: useAid }),
        cid: finalCid,
        html5: 1, // HTML5 平台访问
      }

      const html5QueryString = Object.keys(html5Params)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(html5Params[key])}`)
        .join('&')
      const html5PlayUrl = `https://api.bilibili.com/x/player/playurl?${html5QueryString}`

      try {
        const html5RequestObj = httpFetch(html5PlayUrl, {
          method: 'GET',
          headers: requestHeaders,
        })

        const html5Resp = await html5RequestObj.promise
        const html5Data = html5Resp.body?.data

        console.log('[Bilibili] HTML5 模式响应:', {
          statusCode: html5Resp.statusCode,
          hasData: !!html5Data,
          hasDash: !!html5Data?.dash,
          hasDurl: !!html5Data?.durl,
        })

        if (html5Data) {
          // HTML5 模式通常返回 durl 格式
          if (html5Data.durl && html5Data.durl.length > 0) {
            url = html5Data.durl[0].url
            console.log('[Bilibili] HTML5 模式成功获取播放地址')
          } else if (html5Data.dash && html5Data.dash.audio && html5Data.dash.audio.length > 0) {
            const audios = html5Data.dash.audio
            audios.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))
            url = audios[0].base_url || audios[0].backup_url?.[0]
            console.log('[Bilibili] HTML5 模式使用 dash.audio')
          }
        }
      } catch (html5Error) {
        console.error('[Bilibili] HTML5 模式也失败:', html5Error.message)
      }
    }

    if (!url) {
      console.error('[Bilibili] 所有方式都失败，无法获取播放地址:', {
        hasData: !!data,
        hasDash: !!data?.dash,
        hasDashAudio: !!data?.dash?.audio,
        dashAudioLength: data?.dash?.audio?.length,
        hasDurl: !!data?.durl,
        durlLength: data?.durl?.length,
        fullData: data ? JSON.stringify(data).substring(0, 500) : 'null',
      })
      throw new Error('无法获取播放地址，请检查视频是否可播放')
    }

    console.log('[Bilibili] 成功获取播放地址，URL 长度:', url.length)
    // 返回 URL（移动端可能需要特殊处理 headers）
    return url
  } catch (error) {
    console.error('[Bilibili] getMusicUrl error:', error.message || error)
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

