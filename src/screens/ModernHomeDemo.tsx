/**
 * ModernHomeDemo - 现代化首页演示
 *
 * 展示现代化首页设计，包括：
 * - 快速操作卡片
 * - 最近播放
 * - 歌单网格
 */

import React from 'react'
import { View, ScrollView } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import {
  QuickActionCard,
  PlaylistCard,
  ModernSearchBar,
} from '@/components/modern'
import { createStyle } from '@/utils/tools'

export default function ModernHomeDemo() {
  const theme = useTheme()

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme['c-app-background'] }]}
      contentContainerStyle={styles.content}
    >
      {/* 搜索框 */}
      <View style={styles.section}>
        <ModernSearchBar
          placeholder="搜索歌曲、歌手、专辑"
          onChangeText={(text) => console.log('Search:', text)}
          onSubmit={(text) => console.log('Submit:', text)}
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
            onPress={() => console.log('Search')}
          />

          <QuickActionCard
            icon="love"
            title="每日推荐"
            subtitle="为你精选"
            gradient={[theme['c-primary'], theme['c-primary-dark-200']]}
            onPress={() => console.log('Daily Rec')}
          />

          <QuickActionCard
            icon="album"
            title="我的音乐"
            subtitle="本地和收藏"
            onPress={() => console.log('My Music')}
          />
        </View>
      </View>

      {/* 最近播放 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text size={20} color={theme['c-font']} style={styles.sectionTitle}>
            最近播放
          </Text>
          <Text
            size={14}
            color={theme['c-primary']}
            onPress={() => console.log('See all')}
          >
            查看全部
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {[1, 2, 3, 4, 5].map((item) => (
            <View key={item} style={styles.recentItem}>
              <PlaylistCard
                title={`歌单 ${item}`}
                subtitle="周杰伦"
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
          <Text
            size={14}
            color={theme['c-primary']}
            onPress={() => console.log('See all')}
          >
            查看全部
          </Text>
        </View>

        <View style={styles.playlistGrid}>
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
