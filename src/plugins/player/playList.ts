import TrackPlayer, { State } from 'react-native-track-player'
import BackgroundTimer from 'react-native-background-timer'
import { defaultUrl } from '@/config'
// import { action as playerAction } from '@/store/modules/player'
import settingState from '@/store/setting/state'

const list: LX.Player.Track[] = []

const defaultUserAgent =
  'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Mobile Safari/537.36'
const httpRxp = /^(https?:\/\/.+|\/.+)/

export const state = {
  isPlaying: false,
  prevDuration: -1,
}

const formatMusicInfo = (musicInfo: LX.Player.PlayMusic) => {
  return 'progress' in musicInfo
    ? {
        id: musicInfo.id,
        pic: musicInfo.metadata.musicInfo.meta.picUrl,
        name: musicInfo.metadata.musicInfo.name,
        singer: musicInfo.metadata.musicInfo.singer,
        album: musicInfo.metadata.musicInfo.meta.albumName,
      }
    : {
        id: musicInfo.id,
        pic: musicInfo.meta.picUrl,
        name: musicInfo.name,
        singer: musicInfo.singer,
        album: musicInfo.meta.albumName,
      }
}

const buildTracks = (
  musicInfo: LX.Player.PlayMusic,
  url: LX.Player.Track['url'],
  duration?: LX.Player.Track['duration'],
  headers?: Record<string, string>
): LX.Player.Track[] => {
  const mInfo = formatMusicInfo(musicInfo)
  const track = [] as LX.Player.Track[]
  const isShowNotificationImage = settingState.setting['player.isShowNotificationImage']
  const album = mInfo.album || undefined
  const artwork =
    isShowNotificationImage && mInfo.pic && httpRxp.test(mInfo.pic) ? mInfo.pic : undefined
  
  // 验证并清理URL
  let validUrl: string | undefined = undefined
  if (url && typeof url === 'string') {
    const trimmedUrl = url.trim()
    // 验证URL格式
    if (trimmedUrl && (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://'))) {
      validUrl = trimmedUrl
    } else {
      console.warn('[Player] 无效的URL格式，跳过:', trimmedUrl.substring(0, 100))
    }
  }
  
  if (validUrl) {
    track.push({
      id: `${mInfo.id}__//${Math.random()}__//${validUrl}`,
      url: validUrl,
      title: mInfo.name || 'Unknow',
      artist: mInfo.singer || 'Unknow',
      album,
      artwork,
      userAgent: defaultUserAgent,
          headers: {
            ...headers,
            'User-Agent': defaultUserAgent, // Ensure User-Agent is present
            'Referer': headers?.referer || headers?.Referer || 'https://www.bilibili.com/', // Ensure Referer is present
          }, 
          musicId: mInfo.id,
      // original: { ...musicInfo },
      duration,
    })
  }
  track.push({
    id: `${mInfo.id}__//${Math.random()}__//default`,
    url: defaultUrl,
    title: mInfo.name || 'Unknow',
    artist: mInfo.singer || 'Unknow',
    album,
    artwork,
    musicId: mInfo.id,
    // original: { ...musicInfo },
    duration: 0,
  })
  return track
  // console.log('buildTrack', musicInfo.name, url)
}
// const buildTrack = (musicInfo: LX.Player.PlayMusic, url: LX.Player.Track['url'], duration?: LX.Player.Track['duration']): LX.Player.Track => {
//   const mInfo = formatMusicInfo(musicInfo)
//   const isShowNotificationImage = settingState.setting['player.isShowNotificationImage']
//   const album = mInfo.album || undefined
//   const artwork = isShowNotificationImage && mInfo.pic && httpRxp.test(mInfo.pic) ? mInfo.pic : undefined
//   return url
//     ? {
//         id: `${mInfo.id}__//${Math.random()}__//${url}`,
//         url,
//         title: mInfo.name || 'Unknow',
//         artist: mInfo.singer || 'Unknow',
//         album,
//         artwork,
//         userAgent: defaultUserAgent,
//         musicId: `${mInfo.id}`,
//         original: { ...musicInfo },
//         duration,
//       }
//     : {
//         id: `${mInfo.id}__//${Math.random()}__//default`,
//         url: defaultUrl,
//         title: mInfo.name || 'Unknow',
//         artist: mInfo.singer || 'Unknow',
//         album,
//         artwork,
//         musicId: `${mInfo.id}`,
//         original: { ...musicInfo },
//         duration: 0,
//       }
// }

export const isTempTrack = (trackId: string) => /\/\/default$/.test(trackId)

export const getCurrentTrackId = async () => {
  const currentTrackIndex = await TrackPlayer.getCurrentTrack()
  return list[currentTrackIndex]?.id
}
export const getCurrentTrack = async () => {
  const currentTrackIndex = await TrackPlayer.getCurrentTrack()
  return list[currentTrackIndex]
}

export const updateMetaData = async (
  musicInfo: LX.Player.MusicInfo,
  isPlay: boolean,
  lyric?: string,
  force = false
) => {
  if (!force && isPlay == state.isPlaying) {
    const duration = await TrackPlayer.getDuration()
    if (state.prevDuration != duration) {
      state.prevDuration = duration
      const trackInfo = await getCurrentTrack()
      if (trackInfo && musicInfo) {
        delayUpdateMusicInfo(musicInfo, lyric)
      }
    }
  } else {
    const [duration, trackInfo] = await Promise.all([TrackPlayer.getDuration(), getCurrentTrack()])
    state.prevDuration = duration
    if (trackInfo && musicInfo) {
      delayUpdateMusicInfo(musicInfo, lyric)
    }
  }
}

const handlePlayMusic = async (musicInfo: LX.Player.PlayMusic, url: string, time: number, headers?: Record<string, string>) => {
  try {
    // console.log(tracks, time)
    const tracks = buildTracks(musicInfo, url, undefined, headers)
    const track = tracks[0]
    if (!track) {
      console.error('[Player] 无法构建track，URL可能无效:', url?.substring(0, 100))
      throw new Error('无法构建播放track')
    }
    
    // await updateMusicInfo(track)
    const currentTrackIndex = await TrackPlayer.getCurrentTrack()
    
    try {
      await TrackPlayer.add(tracks)
      list.push(...tracks)
    } catch (addError: any) {
      console.error('[Player] 添加track失败:', addError)
      // 检查是否是B站URL相关错误
      if (url && (url.includes('bilivideo.com') || url.includes('bilibili.com'))) {
        console.warn('[Player] B站URL添加失败，可能的原因：')
        console.warn('1. URL格式问题')
        console.warn('2. TrackPlayer不支持该URL格式')
        console.warn('3. URL需要特殊headers')
      }
      throw addError
    }
    
    const queue = (await TrackPlayer.getQueue()) as LX.Player.Track[]
    const trackIndex = queue.findIndex((t) => t.id == track.id)
    if (trackIndex === -1) {
      console.error('[Player] 无法找到track在队列中的位置')
      throw new Error('无法找到track在队列中的位置')
    }
    
    try {
      await TrackPlayer.skip(trackIndex)
    } catch (skipError: any) {
      console.error('[Player] 跳转到track失败:', skipError)
      throw skipError
    }

    if (currentTrackIndex == null) {
      if (!isTempTrack(track.id as string)) {
        try {
          if (time) await TrackPlayer.seekTo(time)
          if (global.lx.restorePlayInfo) {
            await TrackPlayer.pause()
            // let startupAutoPlay = settingState.setting['player.startupAutoPlay']
            global.lx.restorePlayInfo = null

            // TODO startupAutoPlay
            // if (startupAutoPlay) store.dispatch(playerAction.playMusic())
          } else {
            await TrackPlayer.play()
          }
        } catch (playError: any) {
          console.error('[Player] 播放失败:', playError)
          // 不抛出错误，让错误处理机制处理
          throw playError
        }
      }
    } else {
      try {
        await TrackPlayer.pause()
        if (!isTempTrack(track.id as string)) {
          await TrackPlayer.seekTo(time)
          await TrackPlayer.play()
        }
      } catch (playError: any) {
        console.error('[Player] 播放失败:', playError)
        throw playError
      }
    }

    if (queue.length > 2) {
      void TrackPlayer.remove(
        Array(queue.length - 2)
          .fill(null)
          .map((_, i) => i)
      ).then(() => list.splice(0, list.length - 2)).catch((err) => {
        console.warn('[Player] 清理队列失败:', err)
      })
    }
  } catch (error: any) {
    console.error('[Player] handlePlayMusic 发生错误:', error)
    // 不重新抛出错误，避免导致应用崩溃
    // 错误会通过 PlaybackError 事件处理
    throw error
  }
}
let playPromise = Promise.resolve()
let actionId = Math.random()
export const playMusic = (musicInfo: LX.Player.PlayMusic, url: string, time: number, headers?: Record<string, string>) => {
  const id = (actionId = Math.random())
  void playPromise.finally(() => {
    if (id != actionId) return
    playPromise = handlePlayMusic(musicInfo, url, time, headers)
  })
}

// let musicId = null
// let duration = 0
let prevArtwork: string | undefined
const updateMetaInfo = async (mInfo: LX.Player.MusicInfo, lyric?: string) => {
  console.log('updateMetaInfo', lyric)
  const isShowNotificationImage = settingState.setting['player.isShowNotificationImage']
  // const mInfo = formatMusicInfo(musicInfo)
  // console.log('+++++updateMusicPic+++++', track.artwork, track.duration)

  // if (track.musicId == musicId) {
  //   if (global.playInfo.musicInfo.img != null) artwork = global.playInfo.musicInfo.img
  //   if (track.duration != null) duration = global.playInfo.duration
  // } else {
  //   musicId = track.musicId
  //   artwork = global.playInfo.musicInfo.img
  //   duration = global.playInfo.duration || 0
  // }
  // console.log('+++++updateMetaInfo+++++', mInfo.name)
  state.isPlaying = (await TrackPlayer.getState()) == State.Playing
  let artwork = isShowNotificationImage ? (mInfo.pic ?? prevArtwork) : undefined
  if (mInfo.pic) prevArtwork = mInfo.pic
  let name: string
  let singer: string
  if (!state.isPlaying || lyric == null) {
    name = mInfo.name ?? 'Unknow'
    singer = mInfo.singer ?? 'Unknow'
  } else {
    name = lyric
    singer = `${mInfo.name}${mInfo.singer ? ` - ${mInfo.singer}` : ''}`
  }
  await TrackPlayer.updateNowPlayingMetadata(
    {
      title: name,
      artist: singer,
      album: mInfo.album ?? undefined,
      artwork,
      duration: state.prevDuration || 0,
    },
    state.isPlaying
  )
}

// 解决快速切歌导致的通知栏歌曲信息与当前播放歌曲对不上的问题
const debounceUpdateMetaInfoTools = {
  updateMetaPromise: Promise.resolve(),
  musicInfo: null as LX.Player.MusicInfo | null,
  debounce(fn: (musicInfo: LX.Player.MusicInfo, lyric?: string) => void | Promise<void>) {
    // let delayTimer = null
    let isDelayRun = false
    let timer: number | null = null
    let _musicInfo: LX.Player.MusicInfo | null = null
    let _lyric: string | undefined
    return (musicInfo: LX.Player.MusicInfo, lyric?: string) => {
      // console.log('debounceUpdateMetaInfoTools', musicInfo)
      if (timer) {
        BackgroundTimer.clearTimeout(timer)
        timer = null
      }
      // if (delayTimer) {
      //   BackgroundTimer.clearTimeout(delayTimer)
      //   delayTimer = null
      // }
      if (isDelayRun) {
        _musicInfo = musicInfo
        _lyric = lyric
        timer = BackgroundTimer.setTimeout(() => {
          timer = null
          let musicInfo = _musicInfo
          let lyric = _lyric
          _musicInfo = null
          _lyric = undefined
          if (!musicInfo) return
          // isDelayRun = false
          void fn(musicInfo, lyric)
        }, 500)
      } else {
        isDelayRun = true
        void fn(musicInfo, lyric)
        BackgroundTimer.setTimeout(() => {
          // delayTimer = null
          isDelayRun = false
        }, 500)
      }
    }
  },
  init() {
    return this.debounce(async (musicInfo: LX.Player.MusicInfo, lyric?: string) => {
      this.musicInfo = musicInfo
      return this.updateMetaPromise.then(() => {
        // console.log('run')
        if (this.musicInfo?.id === musicInfo.id) {
          this.updateMetaPromise = updateMetaInfo(musicInfo, lyric)
        }
      })
    })
  },
}

export const delayUpdateMusicInfo = debounceUpdateMetaInfoTools.init()

// export const delayUpdateMusicInfo = ((fn, delay = 800) => {
//   let delayTimer = null
//   let isDelayRun = false
//   let timer = null
//   let _track = null
//   return track => {
//     _track = track
//     if (timer) {
//       BackgroundTimer.clearTimeout(timer)
//       timer = null
//     }
//     if (isDelayRun) {
//       if (delayTimer) {
//         BackgroundTimer.clearTimeout(delayTimer)
//         delayTimer = null
//       }
//       timer = BackgroundTimer.setTimeout(() => {
//         timer = null
//         let track = _track
//         _track = null
//         isDelayRun = false
//         fn(track)
//       }, delay)
//     } else {
//       isDelayRun = true
//       fn(track)
//       delayTimer = BackgroundTimer.setTimeout(() => {
//         delayTimer = null
//         isDelayRun = false
//       }, 500)
//     }
//   }
// })(track => {
//   console.log('+++++delayUpdateMusicPic+++++', track.artwork)
//   updateMetaInfo(track)
// })
