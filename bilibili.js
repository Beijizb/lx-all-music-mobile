/*!
 * @name Bilibili 音源
 * @description 支持 Bilibili 视频/音频搜索和播放
 * @version v1.0.0
 * @author LX Music
 */

const { EVENT_NAMES, request, on, send, utils, env, version } = globalThis.lx;

// Bilibili API 相关配置
const searchHeaders = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
  accept: "application/json, text/plain, */*",
  "accept-encoding": "gzip, deflate, br",
  origin: "https://search.bilibili.com",
  "sec-fetch-site": "same-site",
  "sec-fetch-mode": "cors",
  "sec-fetch-dest": "empty",
  referer: "https://search.bilibili.com/",
  "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
};

const playHeaders = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
  accept: "*/*",
  "accept-encoding": "gzip, deflate, br",
  "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
};

let cookie = null;

// 获取 Cookie
async function getCookie() {
  if (cookie) {
    console.log("[Bilibili] 使用缓存的 Cookie");
    return cookie;
  }
  try {
    console.log("[Bilibili] 开始获取 Cookie...");
    const resp = await new Promise((resolve, reject) => {
      request(
        "https://api.bilibili.com/x/frontend/finger/spi",
        {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/114.0.0.0",
          },
        },
        (err, resp) => {
          if (err) return reject(err);
          resolve(resp);
        }
      );
    });
    const data = resp.body?.data;
    if (data) {
      cookie = data;
      console.log("[Bilibili] Cookie 获取成功:", { b_3: cookie.b_3?.substring(0, 10) + "...", b_4: cookie.b_4?.substring(0, 10) + "..." });
      return cookie;
    } else {
      console.warn("[Bilibili] Cookie 数据为空");
    }
  } catch (error) {
    console.error("[Bilibili] getCookie error:", error.message || error);
  }
  return null;
}

// 将时长转换为秒数
function durationToSec(duration) {
  if (typeof duration === "number") {
    return duration;
  }
  if (typeof duration === "string") {
    const dur = duration.split(":");
    return dur.reduce((prev, curr) => 60 * prev + +curr, 0);
  }
  return 0;
}

// 将秒数转换为 MM:SS 格式
function secToDuration(sec) {
  if (typeof sec !== "number") return null;
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// 从 URL 或其他字段中提取 bvid 或 aid
function extractBvidOrAid(item) {
  // 优先使用已有的 bvid 或 aid
  if (item.bvid) return { bvid: item.bvid, aid: item.aid };
  if (item.aid) return { bvid: null, aid: item.aid };

  // 尝试从 arcurl 或其他 URL 字段中提取
  const url = item.arcurl || item.url || item.link || "";
  if (url) {
    // 匹配 BV 号: /video/BVxxxxxxxxxx
    const bvidMatch = url.match(/\/video\/(BV[a-zA-Z0-9]+)/i);
    if (bvidMatch) {
      return { bvid: bvidMatch[1], aid: item.aid };
    }
    // 匹配 av 号: /video/av123456 或 /video/av123456789
    const aidMatch = url.match(/\/video\/av(\d+)/i);
    if (aidMatch) {
      return { bvid: null, aid: aidMatch[1] };
    }
  }

  // 尝试从其他可能的字段提取
  // 某些 API 可能返回 video_id 或其他字段
  if (item.video_id) {
    // video_id 可能是 bvid 格式
    if (/^BV[a-zA-Z0-9]+$/i.test(item.video_id)) {
      return { bvid: item.video_id, aid: item.aid };
    }
    // 或者可能是 aid
    if (/^\d+$/.test(item.video_id)) {
      return { bvid: null, aid: item.video_id };
    }
  }

  return { bvid: null, aid: null };
}

// 搜索音乐
async function handleSearchMusic(keyword, page, limit) {
  try {
    console.log(`[Bilibili] 开始搜索: keyword="${keyword}", page=${page}, limit=${limit}`);
    await getCookie();
    const pageSize = limit || 20;
    
    const params = {
      context: "",
      page: page,
      order: "",
      page_size: pageSize,
      keyword: keyword,
      duration: "",
      tids_1: "",
      tids_2: "",
      __refresh__: true,
      _extra: "",
      highlight: 1,
      single_column: 0,
      platform: "pc",
      from_source: "",
      search_type: "video",
      dynamic_offset: 0,
    };

    const cookieStr = cookie ? `buvid3=${cookie.b_3};buvid4=${cookie.b_4}` : "";
    const headers = { ...searchHeaders };
    if (cookieStr) headers.cookie = cookieStr;

    const searchUrl = `https://api.bilibili.com/x/web-interface/search/type?${Object.keys(params)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join("&")}`;
    console.log(`[Bilibili] 搜索请求 URL: ${searchUrl.substring(0, 100)}...`);

    const resp = await new Promise((resolve, reject) => {
      request(searchUrl, { method: "GET", headers }, (err, resp) => {
        if (err) {
          console.error("[Bilibili] 搜索请求失败:", err.message || err);
          return reject(err);
        }
        resolve(resp);
      });
    });

    console.log(`[Bilibili] 搜索响应状态: ${resp.statusCode}`);
    console.log(`[Bilibili] 响应 body 类型:`, typeof resp.body);
    console.log(`[Bilibili] 响应 body 结构:`, resp.body ? Object.keys(resp.body) : 'null');
    
    // 处理响应数据
    let bodyData = resp.body;
    if (typeof bodyData === 'string') {
      try {
        bodyData = JSON.parse(bodyData);
      } catch (e) {
        console.error("[Bilibili] 解析响应 JSON 失败:", e);
        throw new Error("搜索失败：响应数据格式错误");
      }
    }
    
    // B站 API 返回格式: { code: 0, data: { result: [...], numResults: number } }
    if (bodyData?.code !== 0 && bodyData?.code !== undefined) {
      console.error("[Bilibili] API 返回错误码:", bodyData.code, bodyData.message);
      throw new Error(`搜索失败：${bodyData.message || '未知错误'}`);
    }
    
    const resultData = bodyData?.data;
    if (!resultData) {
      console.error("[Bilibili] 搜索返回数据格式错误:", {
        hasBody: !!bodyData,
        hasData: !!resultData,
        bodyKeys: bodyData ? Object.keys(bodyData) : [],
        bodyCode: bodyData?.code
      });
      throw new Error("搜索失败：返回数据格式错误");
    }
    
    // result 可能是数组，也可能是对象（包含 vlist 等）
    let resultList = resultData.result;
    if (!resultList) {
      console.error("[Bilibili] 搜索结果不存在:", {
        resultDataKeys: Object.keys(resultData),
        hasResult: !!resultData.result
      });
      throw new Error("搜索失败：搜索结果为空");
    }
    
    // 如果 result 是对象，尝试获取 vlist
    if (!Array.isArray(resultList)) {
      if (resultList.vlist && Array.isArray(resultList.vlist)) {
        resultList = resultList.vlist;
      } else {
        console.error("[Bilibili] result 不是数组:", typeof resultList, resultList);
        throw new Error("搜索失败：搜索结果格式错误");
      }
    }

    console.log(`[Bilibili] 搜索到 ${resultList.length} 个结果，总数: ${resultData.numResults || resultList.length}`);

    const list = resultList
      .map((item, index) => {
        // 提取 bvid 或 aid
        const { bvid, aid } = extractBvidOrAid(item);
        
        // 如果既没有 bvid 也没有 aid，跳过这个结果
        if (!bvid && !aid) {
          console.warn(`[Bilibili] 跳过无效结果（缺少 bvid 和 aid）:`, {
            title: item.title,
            arcurl: item.arcurl,
            url: item.url,
          });
          return null;
        }

        const title = item.title?.replace(/(<em(.*?)>)|(<\/em>)/g, "") || "";
        const duration = durationToSec(item.duration);
        
        const musicItem = {
          id: bvid || aid || `bi_${item.cid || Math.random()}`,
          name: title,
          singer: item.author || item.owner?.name || "未知UP主",
          source: "bi",
          interval: secToDuration(duration),
          meta: {
            songId: bvid || aid || "",
            albumName: bvid || aid || "",
            picUrl: item.pic?.startsWith("//") ? `http:${item.pic}` : item.pic || null,
            qualitys: [{ type: "128k", size: null }],
            _qualitys: { "128k": {} },
            bvid: bvid,
            cid: item.cid,
            aid: aid,
          },
        };
        
        if (index < 3) {
          console.log(`[Bilibili] 结果 ${index + 1}:`, {
            name: musicItem.name,
            singer: musicItem.singer,
            bvid: musicItem.meta.bvid,
            aid: musicItem.meta.aid,
            cid: musicItem.meta.cid
          });
        }
        
        return musicItem;
      })
      .filter((item) => item !== null); // 过滤掉无效结果

    console.log(`[Bilibili] 搜索完成，返回 ${list.length} 首歌曲`);
    const total = resultData.numResults || resultData.page?.total || list.length;
    console.log(`[Bilibili] 返回数据:`, { listLength: list.length, total, page, limit: pageSize });
    return {
      list,
      total: total,
      page: page,
      limit: pageSize,
    };
  } catch (error) {
    console.error("[Bilibili] handleSearchMusic error:", error.message || error);
    console.error("[Bilibili] 错误堆栈:", error.stack);
    throw error;
  }
}

// 获取音乐 URL
async function handleGetMusicUrl(musicInfo, quality) {
  try {
    console.log(`[Bilibili] 开始获取音乐 URL:`, {
      name: musicInfo.name,
      quality: quality,
      bvid: musicInfo.meta?.bvid,
      aid: musicInfo.meta?.aid,
      cid: musicInfo.meta?.cid
    });

    const bvid = musicInfo.meta?.bvid;
    const aid = musicInfo.meta?.aid;
    const cid = musicInfo.meta?.cid;

    if (!bvid && !aid) {
      console.error("[Bilibili] 缺少必要参数: bvid 和 aid 都不存在");
      throw new Error("该视频缺少必要的标识信息（bvid 或 aid），无法播放。请尝试搜索其他视频。");
    }

    // 如果没有 cid，先获取
    let finalCid = cid;
    if (!finalCid) {
      console.log(`[Bilibili] 需要获取 cid, bvid=${bvid}, aid=${aid}`);
      const params = bvid ? { bvid } : { aid };
      const viewUrl = `https://api.bilibili.com/x/web-interface/view?${Object.keys(params)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join("&")}`;
      console.log(`[Bilibili] 请求视频信息: ${viewUrl}`);
      
      const resp = await new Promise((resolve, reject) => {
        request(viewUrl, { method: "GET", headers: playHeaders }, (err, resp) => {
          if (err) {
            console.error("[Bilibili] 获取视频信息失败:", err.message || err);
            return reject(err);
          }
          resolve(resp);
        });
      });
      
      const data = resp.body?.data;
      console.log(`[Bilibili] 视频信息响应状态: ${resp.statusCode}`);
      if (data && data.pages && data.pages.length > 0) {
        finalCid = data.pages[0].cid;
        console.log(`[Bilibili] 获取到 cid: ${finalCid}`);
      } else {
        console.error("[Bilibili] 无法从响应中获取 cid:", {
          hasData: !!data,
          hasPages: !!data?.pages,
          pagesLength: data?.pages?.length
        });
        throw new Error("无法获取 cid");
      }
    } else {
      console.log(`[Bilibili] 使用已有的 cid: ${finalCid}`);
    }

    // 获取播放地址
    const params = {
      ...(bvid ? { bvid } : { aid }),
      cid: finalCid,
      fnval: 16, // 请求 dash 格式
    };

    const playUrl = `https://api.bilibili.com/x/player/playurl?${Object.keys(params)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join("&")}`;
    console.log(`[Bilibili] 请求播放地址: ${playUrl}`);

    const resp = await new Promise((resolve, reject) => {
      request(playUrl, { method: "GET", headers: playHeaders }, (err, resp) => {
        if (err) {
          console.error("[Bilibili] 获取播放地址请求失败:", err.message || err);
          return reject(err);
        }
        resolve(resp);
      });
    });

    console.log(`[Bilibili] 播放地址响应状态: ${resp.statusCode}`);
    const data = resp.body?.data;
    if (!data) {
      console.error("[Bilibili] 播放地址响应数据为空");
      throw new Error("获取播放地址失败");
    }

    let url = null;
    let headers = {};

    // 优先使用 dash.audio
    if (data.dash && data.dash.audio && data.dash.audio.length > 0) {
      console.log(`[Bilibili] 使用 dash.audio, 共 ${data.dash.audio.length} 个音频流`);
      const audios = data.dash.audio;
      // 按带宽排序，选择合适音质
      audios.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0));
      url = audios[0].base_url || audios[0].backup_url?.[0];
      console.log(`[Bilibili] 选择音频流: bandwidth=${audios[0].bandwidth}, id=${audios[0].id}`);
      
      if (url) {
        const hostUrl = url.substring(url.indexOf("/") + 2);
        headers = {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
          accept: "*/*",
          host: hostUrl.substring(0, hostUrl.indexOf("/")),
          "accept-encoding": "gzip, deflate, br",
          connection: "keep-alive",
          referer: `https://www.bilibili.com/video/${bvid || aid}`,
        };
        console.log(`[Bilibili] 音频 URL 获取成功: ${url.substring(0, 100)}...`);
      } else {
        console.warn("[Bilibili] dash.audio 中没有可用的 URL");
      }
    } else if (data.durl && data.durl.length > 0) {
      // 降级使用 durl
      console.log(`[Bilibili] 使用 durl, 共 ${data.durl.length} 个地址`);
      url = data.durl[0].url;
      console.log(`[Bilibili] 音频 URL 获取成功 (durl): ${url.substring(0, 100)}...`);
    } else {
      console.error("[Bilibili] 响应中没有可用的音频地址:", {
        hasDash: !!data.dash,
        hasDashAudio: !!data.dash?.audio,
        dashAudioLength: data.dash?.audio?.length,
        hasDurl: !!data.durl,
        durlLength: data.durl?.length
      });
    }

    if (!url) {
      throw new Error("无法获取播放地址");
    }

    console.log(`[Bilibili] 最终返回 URL 长度: ${url.length}`);
    // 返回 URL（移动端可能需要特殊处理 headers）
    return url;
  } catch (error) {
    console.error("[Bilibili] handleGetMusicUrl error:", error.message || error);
    console.error("[Bilibili] 错误堆栈:", error.stack);
    throw error;
  }
}

// 定义支持的源
const musicSources = {
  bi: {
    name: "bilibili",
    type: "music",
    actions: ["searchMusic", "musicUrl"],
    qualitys: ["128k"], // Bilibili 音频质量
  },
};

// 处理请求
on(EVENT_NAMES.request, ({ action, source, info }) => {
  console.log(`[Bilibili] 收到请求: action=${action}, source=${source}`);
  
  switch (action) {
    case "searchMusic":
      console.log(`[Bilibili] ========== 搜索请求 ==========`);
      console.log(`[Bilibili] 关键词: "${info.keyword}"`);
      console.log(`[Bilibili] 页码: ${info.page || 1}`);
      console.log(`[Bilibili] 每页数量: ${info.limit || 20}`);
      console.log(`[Bilibili] ============================`);
      
      return handleSearchMusic(info.keyword, info.page || 1, info.limit || 20)
        .then((data) => {
          console.log(`[Bilibili] 搜索成功，返回 ${data.list.length} 首歌曲`);
          return Promise.resolve(data);
        })
        .catch((err) => {
          console.error(`[Bilibili] 搜索失败:`, err.message || err);
          return Promise.reject(err);
        });

    case "musicUrl":
      console.log(`[Bilibili] ========== 获取播放地址 ==========`);
      console.log(`[Bilibili] 歌曲: "${info.musicInfo.name}"`);
      console.log(`[Bilibili] 歌手: "${info.musicInfo.singer}"`);
      console.log(`[Bilibili] 音质: ${info.type}`);
      console.log(`[Bilibili] bvid: ${info.musicInfo.meta?.bvid || "无"}`);
      console.log(`[Bilibili] aid: ${info.musicInfo.meta?.aid || "无"}`);
      console.log(`[Bilibili] cid: ${info.musicInfo.meta?.cid || "无"}`);
      console.log(`[Bilibili] ==================================`);
      
      return handleGetMusicUrl(info.musicInfo, info.type)
        .then((data) => {
          console.log(`[Bilibili] 播放地址获取成功`);
          return Promise.resolve(data);
        })
        .catch((err) => {
          console.error(`[Bilibili] 播放地址获取失败:`, err.message || err);
          return Promise.reject(err);
        });

    default:
      console.error(`[Bilibili] 不支持的 action: ${action}`);
      return Promise.reject("action not support");
  }
});

// 导出 sources
if (typeof module !== "undefined" && module.exports) {
  module.exports = { sources: musicSources };
} else {
  globalThis.lx.sources = musicSources;
}

// 触发初始化事件，通知宿主应用源已就绪
send(EVENT_NAMES.inited, {
  sources: musicSources,
}).then(() => {
  console.log("[Bilibili] 初始化成功，源已注册");
}).catch((err) => {
  console.error("[Bilibili] 初始化失败:", err);
});

