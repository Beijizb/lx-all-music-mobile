/**
 * ModernHome - 现代化首页
 *
 * 灵感来自 Spotify、Apple Music、YouTube Music
 * 特性：
 * - 快速操作卡片
 * - 最近播放横向滚动
 * - 推荐歌单网格
 * - 现代化搜索框
 */

import React, { useState, useCallback } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import {
  QuickActionCard,
  PlaylistCard,
  ModernSearchBar,
} from '@/components/modern'
import { createStyle } from '@/utils/tools'
import { setNavActiveId } from '@/core/common'
import { useI18n } from '@/lang'

export default function ModernHome() {
  const theme = useTheme()
  const t = useI18n()
  const [searchText, setSearchText] = useState('')

  const handleSearch = useCallback(() => {
    // 切换到搜索页面
    setNavActiveId('nav_search')
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme['c-app-background'] }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 搜索框 */}
      <View style={styles.section}>
        <ModernSearchBar
          placeholder="搜索歌曲、歌手、专辑"
          value={searchText}
          onChangeText={setSearchText}
          onSubmit={handleSearch}
          onFocus={handleSearch}
        />
      </View>

      {/* 快速操作 */}
      <View style={styles.section}>
        <Text size={20} color={theme['c-font']} style={styles.sectionTitle}>
          快速操作
        </Text>

        <View style={styles.quickActionsGrid}>
          <QuickActionCard
            icon="search-2"
            title="搜索"
            subtitle="发现更多音乐"
            onPress={() => handleQuickAction('search')}
          />

          <QuickActionCard
            icon="love"
            title="每日推荐"
            subtitle="为你精选"
            gradient={[theme['c-primary'], theme['c-primary-dark-200']]}
            onPress={() => handleQuickAction('daily')}
          />

          <QuickActionCard
            icon="album"
            title="我的音乐"
            subtitle="本地和收藏"
            onPress={() => handleQuickAction('mylist')}
          />

          <QuickActionCard
            icon="trophy"
            title="排行榜"
            subtitle="热门歌曲"
            onPress={() => handleQuickAction('leaderboard')}
          />
        </View>
      </View>

      {/* 最近播放 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text size={20} color={theme['c-font']} style={styles.sectionTitle}>
            最近播放
          </Text>
          <TouchableOpacity onPress={() => handleQuickAction('mylist')}>
            <Text size={14} color={theme['c-primary']}>
              查看全部
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {/* 这里可以从播放历史中获取数据 */}
          {[1, 2, 3, 4, 5].map((item) => (
            <View key={item} style={styles.recentItem}>
              <PlaylistCard
                title={`歌单 ${item}`}
                subtitle="最近播放"
                count={20}
                onPress={() => console.log('Playlist', item)}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 推荐歌单 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text size={20} color={theme['c-font']} style={styles.sectionTitle}>
            推荐歌单
          </Text>
          <TouchableOpacity onPress={() => handleQuickAction('daily')}>
            <Text size={14} color={theme['c-primary']}>
              查看全部
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playlistGrid}>
          {/* 这里可以从每日推荐中获取数据 */}
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <View key={item} style={styles.playlistItem}>
              <PlaylistCard
                title={`推荐歌单 ${item}`}
                subtitle="精选好歌"
                count={50}
                onPress={() => console.log('Playlist', item)}
              />
            </View>
          ))}
        </View>
      </View>

      {/* 底部间距 */}
      <View style={{ height: 100 }} />
    </ScrollView>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  quickActionsGrid: {
    gap: 12,
  },
  horizontalList: {
    gap: 16,
    paddingRight: 16,
  },
  recentItem: {
    width: 140,
  },
  playlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  playlistItem: {
    width: '47%',
  },
})
