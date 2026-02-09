/**
 * PlaylistCard - 歌单卡片组件
 *
 * 用于展示歌单、专辑等，支持网格布局
 *
 * 特性：
 * - 封面 + 标题 + 副标题
 * - 按压动画
 * - 自适应主题
 * - 支持徽章
 */

import React, { useRef } from 'react'
import { View, Pressable, Animated } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import themeState from '@/store/theme/state'
import { ThemeFrameworkType } from '@/theme/ThemeFramework'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import Icon from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'

export interface PlaylistCardProps {
  coverUri?: string
  title: string
  subtitle?: string
  count?: number
  onPress: () => void
}

export default function PlaylistCard({
  coverUri,
  title,
  subtitle,
  count,
  onPress,
}: PlaylistCardProps) {
  const theme = useTheme()
  const framework = themeState.framework
  const scaleAnim = useRef(new Animated.Value(1)).current

  const isMaterial = framework === ThemeFrameworkType.MATERIAL

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start()
  }

  const borderRadius = isMaterial ? 12 : 10

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={
        isMaterial
          ? {
              color: theme['c-primary-light-200-alpha-700'],
              borderless: false,
            }
          : undefined
      }
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* 封面 */}
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
              <Icon
                name="album"
                size={48}
                color={theme['c-primary']}
              />
            </View>
          )}

          {/* 歌曲数量徽章 */}
          {count !== undefined && (
            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: isMaterial ? 12 : 10,
                },
              ]}
            >
              <Icon name="music" size={12} color="#FFFFFF" />
              <Text size={12} color="#FFFFFF" style={styles.countText}>
                {count}
              </Text>
            </View>
          )}
        </View>

        {/* 信息 */}
        <View style={styles.infoContainer}>
          <Text
            size={15}
            color={theme['c-font']}
            numberOfLines={2}
            style={styles.title}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              size={13}
              color={theme['c-font-label']}
              numberOfLines={1}
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
  },
  coverContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  countBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  infoContainer: {
    paddingTop: 8,
  },
  title: {
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 16,
  },
})
