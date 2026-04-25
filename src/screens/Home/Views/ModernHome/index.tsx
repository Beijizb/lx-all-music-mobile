import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useMyList } from '@/store/list/hook'
import { usePlayMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'
import {
  QuickActionCard,
  PlaylistCard,
  ModernSearchBar,
} from '@/components/modern'
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

export default function ModernHome() {
  const theme = useTheme()
  const allLists = useMyList()
  const playMusicInfo = usePlayMusicInfo()
  const [searchText, setSearchText] = useState('')
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme['c-app-background'] }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.searchSection}>
        <ModernSearchBar
          placeholder="搜索歌曲、歌手、歌单"
          value={searchText}
          onChangeText={setSearchText}
          onSubmit={handleSearch}
          onFocus={handleSearch}
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.86}
        style={[
          styles.nowPlaying,
          {
            backgroundColor: theme['c-primary-light-400-alpha-700'],
            borderColor: theme['c-primary-light-600-alpha-700'],
          },
        ]}
        onPress={() => handleQuickAction('mylist')}
      >
        <View
          style={[
            styles.nowPlayingCover,
            { backgroundColor: theme['c-primary-light-200-alpha-700'] },
          ]}
        >
          {currentCover ? (
            <Image url={currentCover} style={styles.nowPlayingImage} />
          ) : (
            <Icon name="music" size={38} color={theme['c-primary']} />
          )}
        </View>
        <View style={styles.nowPlayingInfo}>
          <Text size={13} color={theme['c-font-label']} numberOfLines={1}>
            {currentMusic ? '正在播放' : '准备播放'}
          </Text>
          <Text size={21} color={theme['c-font']} numberOfLines={1} style={styles.heroTitle}>
            {currentMusic?.name || '打开你的音乐库'}
          </Text>
          <Text size={14} color={theme['c-font-label']} numberOfLines={1}>
            {currentMusic?.singer || `${visibleLists.length} 个歌单可用`}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme['c-font-label']} />
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.quickActionsGrid}>
          <View style={styles.quickActionItem}>
            <QuickActionCard
              icon="search-2"
              title="搜索"
              subtitle="全源查找"
              onPress={() => handleQuickAction('search')}
            />
          </View>
          <View style={styles.quickActionItem}>
            <QuickActionCard
              icon="love"
              title="每日推荐"
              subtitle="今日歌单"
              onPress={() => handleQuickAction('daily')}
            />
          </View>
          <View style={styles.quickActionItem}>
            <QuickActionCard
              icon="album"
              title="我的音乐"
              subtitle="收藏列表"
              onPress={() => handleQuickAction('mylist')}
            />
          </View>
          <View style={styles.quickActionItem}>
            <QuickActionCard
              icon="trophy"
              title="排行榜"
              subtitle="热门趋势"
              onPress={() => handleQuickAction('leaderboard')}
            />
          </View>
        </View>
      </View>

      {recentTracks.length ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text size={18} color={theme['c-font']} style={styles.sectionTitle}>
              最近的音乐
            </Text>
            <TouchableOpacity onPress={() => handleQuickAction('mylist')}>
              <Text size={13} color={theme['c-primary']}>
                查看全部
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {recentTracks.map((music) => (
              <View key={music.id} style={styles.recentItem}>
                <PlaylistCard
                  coverUri={music.meta?.picUrl}
                  title={music.name}
                  subtitle={music.singer}
                  onPress={() => handleQuickAction('mylist')}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text size={18} color={theme['c-font']} style={styles.sectionTitle}>
            我的歌单
          </Text>
          <TouchableOpacity onPress={() => handleQuickAction('mylist')}>
            <Text size={13} color={theme['c-primary']}>
              管理
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playlistGrid}>
          {visibleLists.map((list) => (
            <View key={list.id} style={styles.playlistItem}>
              <PlaylistCard
                coverUri={list.coverUri}
                title={list.name}
                subtitle={list.count ? `${list.count} 首歌曲` : '暂无歌曲'}
                count={list.count}
                onPress={() => openList(list.id)}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchSection: {
    marginBottom: 14,
  },
  nowPlaying: {
    minHeight: 116,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowPlayingCover: {
    width: 86,
    height: 86,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },
  nowPlayingImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  nowPlayingInfo: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    fontWeight: '700',
    marginTop: 5,
    marginBottom: 5,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48.5%',
    marginBottom: 10,
  },
  horizontalList: {
    paddingRight: 16,
  },
  recentItem: {
    width: 128,
    marginRight: 14,
  },
  playlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  playlistItem: {
    width: '48.5%',
    marginBottom: 18,
  },
  bottomSpacer: {
    height: 96,
  },
})
