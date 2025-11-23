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

    // 如果没有 cid，先获取
    let finalCid = cid
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
      
      biLog.info('获取 cid 请求 URL:', viewUrl)
      biLog.info('请求参数:', params)

      const requestObj = httpFetch(viewUrl, {
        method: 'GET',
        headers: playHeaders,
      })

      const resp = await requestObj.promise
      const data = resp.body?.data

      biLog.info('获取 cid 响应:', {
        statusCode: resp.statusCode,
        hasData: !!data,
        hasPages: !!data?.pages,
        pagesLength: data?.pages?.length,
      })

      if (data && data.pages && data.pages.length > 0) {
        finalCid = data.pages[0].cid
        biLog.info('成功获取 cid:', finalCid)
      } else {
        biLog.error('无法获取 cid，响应数据:', {
          body: resp.body,
          data: data,
        })
        throw new Error('无法获取 cid')
      }
    } else {
      biLog.info('使用已有的 cid:', finalCid)
    }

    // 获取播放地址
    // 参考 bilibili-api-ts 文档：get_download_url(page_index, cid, html5)
    // 需要 cid 或 page_index，至少提供一个
    // html5: 是否以 html5 平台访问，链接少但可以直接播放
    
    // 首先尝试使用标准 API（dash 格式，音视频分离）
    // 注意：新版本 API 使用 /x/player/wbi/playurl，需要 WBI 签名
    // 注意：720P以下不需要Cookie，720P及以上需要SESSDATA Cookie
    // 当前不强制要求Cookie，会优先获取可用的清晰度
    const params = {
      ...(useBvid ? { bvid: useBvid } : { aid: useAid }),
      cid: finalCid,
      fnval: 16, // 请求 dash 格式（音视频分离）
      fnver: 0, // 固定值
      fourk: 0, // 默认不支持4K（需要大会员），设为0可获取更多可用清晰度
      qn: 64, // 请求720P（如果无Cookie会自动降级到480P）
    }

    // 对播放参数进行 WBI 签名
    let signedParams
    try {
      signedParams = await signWbi(params)
    } catch (error) {
      biLog.warn('播放接口 WBI 签名失败，使用原始参数:', error.message)
      signedParams = params
    }

    // 优先尝试使用 WBI 签名的 API
    const queryString = paramsToQuery(signedParams)
    let playUrl = `https://api.bilibili.com/x/player/wbi/playurl?${queryString}`

    biLog.info('请求播放地址 URL:', playUrl)
    biLog.info('请求参数:', params)

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

    try {
      const requestObj = httpFetch(playUrl, {
        method: 'GET',
        headers: requestHeaders,
      })

      const resp = await requestObj.promise
      
      // 检查响应状态码
      if (resp.statusCode !== 200) {
        biLog.warn(`播放地址 API 返回非 200 状态码: ${resp.statusCode}`)
        throw new Error(`API 返回状态码: ${resp.statusCode}`)
      }
      
      // 处理响应体
      let bodyData = resp.body
      if (typeof bodyData === 'string') {
        try {
          bodyData = JSON.parse(bodyData)
        } catch (e) {
          biLog.error('解析播放地址响应 JSON 失败:', e)
          throw new Error('响应数据格式错误')
        }
      }
      
      // 检查 API 返回的 code
      if (bodyData?.code !== 0 && bodyData?.code !== undefined) {
        biLog.error('播放地址 API 返回错误码:', bodyData.code, bodyData.message)
        const errorMsg = bodyData.message || '未知错误'
        // 检查是否是地区限制
        if (errorMsg.includes('地区') || errorMsg.includes('区域') || errorMsg.includes('地区限制') || 
            bodyData.code === -10403 || bodyData.code === -10404) {
          // 不立即抛出错误，继续尝试其他方法
          biLog.warn('检测到可能的地区限制，将尝试其他方法')
        } else {
          // 其他错误也继续尝试，不立即抛出
          biLog.warn('API 返回错误，将尝试其他方法:', errorMsg)
        }
        throw new Error(`标准 API 失败: ${errorMsg}`)
      }
      
      data = bodyData?.data

      biLog.info('播放地址响应:', {
        statusCode: resp.statusCode,
        apiCode: bodyData?.code,
        hasData: !!data,
        hasDash: !!data?.dash,
        hasDurl: !!data?.durl,
        dashAudioLength: data?.dash?.audio?.length,
        durlLength: data?.durl?.length,
      })

      if (!data) {
        biLog.warn('标准 API 响应数据为空，尝试 HTML5 模式')
        throw new Error('标准 API 无数据')
      }

      // 优先使用 dash.audio（音视频分离格式，纯音频流）
      if (data.dash && data.dash.audio && data.dash.audio.length > 0) {
        const audios = data.dash.audio
        // 按带宽排序，选择合适音质（带宽越大音质越好）
        audios.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))
        const selectedAudio = audios[0]
        // 优先使用 base_url，如果没有则使用 backup_url 的第一个
        url = selectedAudio.base_url || selectedAudio.baseUrl || 
              (selectedAudio.backup_url && selectedAudio.backup_url[0]) ||
              (selectedAudio.backupUrl && selectedAudio.backupUrl[0])
        
        // 处理 URL 中的 Unicode 转义符
        if (url) {
          try {
            url = decodeURIComponent(url)
          } catch (e) {
            // 如果解码失败，使用原始 URL
            biLog.warn('URL Unicode 解码失败，使用原始 URL')
          }
        }
        
        biLog.info('使用 dash.audio（纯音频流），选择音质:', {
          bandwidth: selectedAudio.bandwidth,
          id: selectedAudio.id,
          codecs: selectedAudio.codecs,
          hasUrl: !!url,
        })
      }
      
      // 如果没有音频流，使用视频流（视频流也包含音频，音视频混合）
      if (!url && data.dash && data.dash.video && data.dash.video.length > 0) {
        const videos = data.dash.video
        // 按带宽排序，选择合适清晰度（带宽越大清晰度越好）
        videos.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))
        const selectedVideo = videos[0]
        // 优先使用 base_url，如果没有则使用 backup_url 的第一个
        url = selectedVideo.base_url || selectedVideo.baseUrl ||
              (selectedVideo.backup_url && selectedVideo.backup_url[0]) ||
              (selectedVideo.backupUrl && selectedVideo.backupUrl[0])
        
        // 处理 URL 中的 Unicode 转义符
        if (url) {
          try {
            url = decodeURIComponent(url)
          } catch (e) {
            biLog.warn('URL Unicode 解码失败，使用原始 URL')
          }
        }
        
        biLog.info('使用 dash.video（音视频混合流），选择清晰度:', {
          bandwidth: selectedVideo.bandwidth,
          id: selectedVideo.id,
          codecs: selectedVideo.codecs,
          width: selectedVideo.width,
          height: selectedVideo.height,
          hasUrl: !!url,
        })
      }
      
      // 如果 DASH 格式都没有，降级使用 durl（FLV/MP4 格式，音视频混合）
      if (!url && data.durl && data.durl.length > 0) {
        const durlItem = data.durl[0]
        url = durlItem.url || durlItem.backup_url?.[0]
        
        // 处理 URL 中的 Unicode 转义符
        if (url) {
          try {
            url = decodeURIComponent(url)
          } catch (e) {
            biLog.warn('URL Unicode 解码失败，使用原始 URL')
          }
        }
        
        biLog.info('使用 durl 格式（MP4/FLV，音视频混合），hasUrl:', !!url)
      }
    } catch (error) {
      biLog.warn('标准 API 请求失败，尝试 HTML5 模式:', error.message)
    }

    // 如果标准 API 失败，尝试多个备用方案
    if (!url) {
      // 方案1: 尝试 HTML5 模式（参考 bilibili-api-ts 文档）
      biLog.info('尝试使用 HTML5 模式获取播放地址')
      const html5Params = {
        ...(useBvid ? { bvid: useBvid } : { aid: useAid }),
        cid: finalCid,
        html5: 1, // HTML5 平台访问
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
            biLog.error('HTML5 模式解析响应 JSON 失败:', e)
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
                console.warn('[Bilibili] HTML5 URL Unicode 解码失败，使用原始 URL')
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
                console.warn('[Bilibili] HTML5 URL Unicode 解码失败，使用原始 URL')
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
                console.warn('[Bilibili] HTML5 URL Unicode 解码失败，使用原始 URL')
              }
            }
            
            biLog.info('HTML5 模式使用 durl（MP4/FLV，音视频混合），hasUrl:', !!url)
          }
        }
      } catch (html5Error) {
        biLog.error('HTML5 模式也失败:', html5Error.message)
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
              biLog.error('旧版 API 解析响应 JSON 失败:', e)
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
          biLog.error('旧版 API 也失败:', oldError.message)
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
              biLog.error('低清晰度模式解析响应 JSON 失败:', e)
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
          biLog.error('低清晰度模式也失败:', lowQnError.message)
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

      biLog.error('所有方式都失败，无法获取播放地址:', {
        ...errorDetails,
        fullData: data ? JSON.stringify(data).substring(0, 500) : 'null',
        bvid: useBvid,
        aid: useAid,
        cid: finalCid,
      })
      
      throw new Error(errorMessage)
    }

    biLog.info('成功获取播放地址，URL 长度:', url.length)
    // 返回 URL（移动端可能需要特殊处理 headers）
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

