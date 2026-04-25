import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useMyList } from '@/store/list/hook'
import { usePlayMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import Image, { defaultHeaders } from '@/components/common/Image'
import ImageBackground from '@/components/common/ImageBackground'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { setNavActiveId } from '@/core/common'
import { getListMusics, setActiveList } from '@/core/list'

interface HomeListSummary {
  id: string
  name: string
  count: number
  coverUri?: string
  tracks: LX.Music.MusicInfo[]
}

const getCover = (musics: LX.Music.MusicInfo[]) => {
  return musics.find((music) => music.meta?.picUrl)?.meta.picUrl ?? undefined
}

const getPlayableMusicInfo = (musicInfo: LX.Player.PlayMusic | null) => {
  if (!musicInfo) return null
  return 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 11) return 'Good Morning'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

const DynamicSandBackdrop = ({ coverUri }: { coverUri?: string }) => {
  return (
    <View style={styles.backdrop}>
      <View style={styles.backdropBase} />
      {coverUri ? (
        <ImageBackground
          source={{ uri: coverUri, headers: defaultHeaders }}
          blurRadius={42}
          resizeMode="cover"
          style={styles.backdropImage}
        >
          <View style={styles.backdropImageWash} />
        </ImageBackground>
      ) : null}
      <View style={[styles.colorWash, styles.colorWashSky]} />
      <View style={[styles.colorWash, styles.colorWashSand]} />
      <View style={[styles.colorWash, styles.colorWashRose]} />
      <View style={styles.backdropVeil} />
    </View>
  )
}

export default function ModernHome() {
  const theme = useTheme()
  const allLists = useMyList()
  const playMusicInfo = usePlayMusicInfo()
  const [listSummaries, setListSummaries] = useState<HomeListSummary[]>([])

  const currentMusic = getPlayableMusicInfo(playMusicInfo.musicInfo)
  const currentCover = currentMusic?.meta?.picUrl

  const handleSearch = useCallback(() => {
    setNavActiveId('nav_search')
  }, [])

  const openList = useCallback((listId: string) => {
    setActiveList(listId)
    setNavActiveId('nav_love')
  }, [])

  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'search':
        setNavActiveId('nav_search')
        break
      case 'daily':
        setNavActiveId('nav_daily_rec')
        break
      case 'mylist':
        setNavActiveId('nav_love')
        break
      case 'leaderboard':
        setNavActiveId('nav_top')
        break
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const refreshLists = async () => {
      const summaries = await Promise.all(
        allLists.map(async (list) => {
          const musics = await getListMusics(list.id).catch(() => [])
          return {
            id: list.id,
            name: list.name,
            count: musics.length,
            coverUri: getCover(musics),
            tracks: musics.slice(0, 2),
          }
        })
      )
      if (mounted) setListSummaries(summaries)
    }

    const handleMusicUpdate = (ids: string[]) => {
      if (!ids.some((id) => allLists.some((list) => list.id === id))) return
      void refreshLists()
    }

    void refreshLists()
    global.app_event.on('myListMusicUpdate', handleMusicUpdate)

    return () => {
      mounted = false
      global.app_event.off('myListMusicUpdate', handleMusicUpdate)
    }
  }, [allLists])

  const recentTracks = useMemo(() => {
    const tracks: LX.Music.MusicInfo[] = []
    for (const list of listSummaries) {
      for (const music of list.tracks) {
        if (!tracks.some((item) => item.id === music.id)) tracks.push(music)
        if (tracks.length >= 8) return tracks
      }
    }
    return tracks
  }, [listSummaries])

  const visibleLists = listSummaries.length
    ? listSummaries.slice(0, 6)
    : allLists.slice(0, 6).map((list) => ({
        id: list.id,
        name: list.name,
        count: 0,
        coverUri: undefined,
        tracks: [],
      }))
  const heroList = visibleLists.find((list) => list.coverUri) ?? visibleLists[0]
  const heroCover = currentCover || heroList?.coverUri || recentTracks[0]?.meta?.picUrl
  const heroTitle = currentMusic?.name || heroList?.name || '春日微风'
  const heroSubtitle = currentMusic?.singer || (heroList?.count ? `${heroList.count} 首歌曲` : '用音乐开启美好的一天')

  const actionItems = [
    { key: 'daily', icon: 'music', title: '每日推荐', color: '#8DC56F' },
    { key: 'leaderboard', icon: 'leaderboard', title: '排行榜', color: '#5DA9E9' },
    { key: 'mylist', icon: 'love', title: '收藏歌单', color: '#9B6FE8' },
    { key: 'search', icon: 'search-2', title: '全源搜索', color: '#F0A94A' },
    { key: 'mylist', icon: 'album', title: '本地音乐', color: '#E77DA6' },
  ]

  const glassCardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    borderColor: 'rgba(255, 255, 255, 0.72)',
  }

  return (
    <View style={styles.container}>
      <DynamicSandBackdrop coverUri={heroCover} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.topIconBtn}
          onPress={() => handleQuickAction('mylist')}
        >
          <Icon name="menu" size={22} color={theme['c-font']} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.topIconBtn}
          onPress={handleSearch}
        >
          <Icon name="search-2" size={24} color={theme['c-font']} />
        </TouchableOpacity>
      </View>

      <View style={styles.greetingBlock}>
        <Text size={30} color={theme['c-font']} style={styles.greetingTitle}>
          {getGreeting()}
        </Text>
        <Text size={15} color={theme['c-font-label']} style={styles.greetingSubtitle}>
          用音乐开启美好的一天
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.heroCard, glassCardStyle]}
        onPress={() => (currentMusic ? handleQuickAction('mylist') : heroList ? openList(heroList.id) : handleQuickAction('daily'))}
      >
        {heroCover ? (
          <Image url={heroCover} style={styles.heroImage} />
        ) : (
          <View style={styles.heroImageFallback}>
            <Icon name="music" size={96} color={theme['c-primary']} />
          </View>
        )}
        <View style={styles.heroScrim} />
        <View style={styles.heroContent}>
          <Text size={13} color={theme['c-primary']} style={styles.heroEyebrow}>
            今日推荐
          </Text>
          <Text size={28} color="#202124" numberOfLines={1} style={styles.heroTitle}>
            {heroTitle}
          </Text>
          <Text size={16} color="#5F6670" numberOfLines={1} style={styles.heroSubtitle}>
            {heroSubtitle}
          </Text>
          <View style={[styles.heroPlayBtn, { backgroundColor: theme['c-primary'] }]}>
            <Icon name="play" size={28} color="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionList}
      >
        {actionItems.map((item, index) => (
          <TouchableOpacity
            key={`${item.key}_${index}`}
            activeOpacity={0.82}
            style={[
              styles.actionCard,
              glassCardStyle,
            ]}
            onPress={() => handleQuickAction(item.key)}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: `${item.color}20` }]}>
              <Icon name={item.icon} size={28} color={item.color} />
            </View>
            <Text size={13} color={theme['c-font']} numberOfLines={1} style={styles.actionText}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {recentTracks.length ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity activeOpacity={0.75} onPress={() => handleQuickAction('mylist')} style={styles.sectionTitleRow}>
              <Text size={20} color={theme['c-font']} style={styles.sectionTitle}>
                为你推荐
              </Text>
              <Icon name="chevron-right" size={16} color={theme['c-font-label']} />
            </TouchableOpacity>
            <Text size={13} color={theme['c-font-label']}>换一换</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {recentTracks.map((music) => (
              <TouchableOpacity
                key={music.id}
                activeOpacity={0.86}
                style={[styles.recommendCard, glassCardStyle]}
                onPress={() => handleQuickAction('mylist')}
              >
                <View style={styles.recommendCoverWrap}>
                  {music.meta?.picUrl ? (
                    <Image url={music.meta.picUrl} style={styles.recommendCover} />
                  ) : (
                    <View style={styles.recommendCoverFallback}>
                      <Icon name="music" size={42} color={theme['c-primary']} />
                    </View>
                  )}
                  <View style={styles.recommendPlayBtn}>
                    <Icon name="play" size={20} color="#394049" />
                  </View>
                </View>
                <View style={styles.recommendInfo}>
                  <Text size={14} color={theme['c-font']} numberOfLines={1} style={styles.recommendTitle}>
                    {music.name}
                  </Text>
                  <Text size={12} color={theme['c-font-label']} numberOfLines={1}>
                    {music.singer || '轻音乐精选'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text size={20} color={theme['c-font']} style={styles.sectionTitle}>我的歌单</Text>
          <TouchableOpacity onPress={() => handleQuickAction('mylist')}>
            <Text size={13} color={theme['c-primary']}>
              管理
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playlistGrid}>
          {visibleLists.map((list) => (
            <TouchableOpacity
              key={list.id}
              activeOpacity={0.86}
              style={[styles.listCard, glassCardStyle]}
              onPress={() => openList(list.id)}
            >
              {list.coverUri ? (
                <Image url={list.coverUri} style={styles.listCover} />
              ) : (
                <View style={styles.listCoverFallback}>
                  <Icon name="album" size={32} color={theme['c-primary']} />
                </View>
              )}
              <View style={styles.listInfo}>
                <Text size={14} color={theme['c-font']} numberOfLines={1} style={styles.listTitle}>
                  {list.name}
                </Text>
                <Text size={12} color={theme['c-font-label']} numberOfLines={1}>
                  {list.count ? `${list.count} 首歌曲` : '暂无歌曲'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  backdropBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F7F4ED',
  },
  backdropImage: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    height: 420,
    opacity: 0.34,
  },
  backdropImageWash: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
  },
  colorWash: {
    position: 'absolute',
    left: -40,
    right: -40,
    height: 210,
    opacity: 0.46,
  },
  colorWashSky: {
    top: 70,
    backgroundColor: 'rgba(178, 221, 238, 0.62)',
    transform: [{ rotate: '-8deg' }],
  },
  colorWashSand: {
    top: 250,
    backgroundColor: 'rgba(240, 221, 177, 0.58)',
    transform: [{ rotate: '7deg' }],
  },
  colorWashRose: {
    top: 430,
    backgroundColor: 'rgba(230, 188, 205, 0.42)',
    transform: [{ rotate: '-5deg' }],
  },
  backdropVeil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  topBar: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  topIconBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingBlock: {
    marginBottom: 22,
  },
  greetingTitle: {
    fontWeight: '800',
  },
  greetingSubtitle: {
    marginTop: 8,
  },
  heroCard: {
    height: 210,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  heroImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  heroImageFallback: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.36)',
  },
  heroScrim: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 26,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  heroEyebrow: {
    fontWeight: '700',
    marginBottom: 14,
  },
  heroTitle: {
    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: 10,
  },
  heroPlayBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  actionList: {
    paddingRight: 18,
    marginBottom: 28,
  },
  actionCard: {
    width: 104,
    height: 104,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '800',
  },
  horizontalList: {
    paddingRight: 18,
  },
  recommendCard: {
    width: 152,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  recommendCoverWrap: {
    width: '100%',
    height: 142,
    position: 'relative',
  },
  recommendCover: {
    width: '100%',
    height: '100%',
  },
  recommendCoverFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },
  recommendPlayBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendInfo: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  recommendTitle: {
    fontWeight: '700',
    marginBottom: 5,
  },
  playlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  listCard: {
    width: '48.5%',
    minHeight: 70,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listCover: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  listCoverFallback: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },
  listInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  listTitle: {
    fontWeight: '700',
    marginBottom: 5,
  },
  bottomSpacer: {
    height: 96,
  },
})
