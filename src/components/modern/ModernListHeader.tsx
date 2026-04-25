/**
 * ModernListHeader - 现代化列表头部组件
 *
 * 用于音乐列表、歌单详情等页面的头部
 *
 * 特性：
 * - 大封面（可选）
 * - 标题 + 副标题
 * - 播放全部按钮
 * - 更多操作按钮
 * - 自适应主题
 */

import React from 'react'
import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import themeState from '@/store/theme/state'
import { ThemeFrameworkType } from '@/theme/ThemeFramework'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'
import { ModernButton } from '@/components/modern'
import { createStyle } from '@/utils/tools'

export interface ModernListHeaderProps {
  // 封面
  coverUri?: string
  showCover?: boolean

  // 信息
  title: string
  subtitle?: string
  description?: string

  // 统计
  count?: number
  duration?: string

  // 操作
  onPlayAll?: () => void
  onMore?: () => void
}

export default function ModernListHeader({
  coverUri,
  showCover = true,
  title,
  subtitle,
  description,
  count,
  duration,
  onPlayAll,
  onMore,
}: ModernListHeaderProps) {
  const theme = useTheme()
  const framework = themeState.framework

  const isMaterial = framework === ThemeFrameworkType.MATERIAL
  const borderRadius = isMaterial ? 16 : 14

  return (
    <View style={styles.container}>
      {/* 封面（如果显示） */}
      {showCover && (
        <View
          style={[
            styles.coverContainer,
            {
              borderRadius,
              backgroundColor: theme['c-primary-light-400-alpha-700'],
            },
          ]}
        >
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={[styles.cover, { borderRadius }]}
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Icon name="album" size={64} color={theme['c-primary']} />
            </View>
          )}
        </View>
      )}

      {/* 信息区域 */}
      <View style={styles.infoContainer}>
        {/* 标题 */}
        <Text
          size={24}
          color={theme['c-font']}
          numberOfLines={2}
          style={styles.title}
        >
          {title}
        </Text>

        {/* 副标题 */}
        {subtitle && (
          <Text
            size={15}
            color={theme['c-font-label']}
            numberOfLines={1}
            style={styles.subtitle}
          >
            {subtitle}
          </Text>
        )}

        {/* 统计信息 */}
        {(count !== undefined || duration) && (
          <View style={styles.statsRow}>
            {count !== undefined && (
              <View style={styles.statItem}>
                <Icon
                  name="music"
                  size={14}
                  color={theme['c-font-label']}
                />
                <Text
                  size={13}
                  color={theme['c-font-label']}
                  style={styles.statText}
                >
                  {count} 首
                </Text>
              </View>
            )}
            {duration && (
              <View style={styles.statItem}>
                <Icon
                  name="time"
                  size={14}
                  color={theme['c-font-label']}
                />
                <Text
                  size={13}
                  color={theme['c-font-label']}
                  style={styles.statText}
                >
                  {duration}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 描述 */}
        {description && (
          <Text
            size={14}
            color={theme['c-font-label']}
            numberOfLines={3}
            style={styles.description}
          >
            {description}
          </Text>
        )}
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionsContainer}>
        {onPlayAll && (
          <ModernButton
            variant="primary"
            size="large"
            icon="play"
            onPress={onPlayAll}
            style={styles.playButton}
          >
            播放全部
          </ModernButton>
        )}
        {onMore && (
          <ModernButton
            variant="secondary"
            size="large"
            icon="more-vert"
            onPress={onMore}
          />
        )}
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    padding: 20,
  },
  coverContainer: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 20,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
  },
  description: {
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    flex: 1,
  },
})
