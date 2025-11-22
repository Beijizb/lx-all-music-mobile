// B站歌词接口
// 由于B站视频通常不提供歌词，直接返回空歌词，避免获取失败影响播放

export default {
  getLyric(songInfo) {
    // 返回一个空的歌词对象，避免歌词获取失败影响播放
    const requestObj = {
      promise: Promise.resolve({
        lyric: '',
        tlyric: '',
        lxlyric: '',
        rlyric: '',
      }),
      cancelHttp() {
        // 无需取消，因为已经立即解析
      },
    }
    return requestObj
  },
}

