/**
 * QuickActionCard - 快速操作卡片组件
 *
 * 用于首页的快速入口，如搜索、每日推荐、我的音乐等
 *
 * 特性：
 * - 渐变背景
 * - 图标 + 文字
 * - 按压动画
 * - 自适应主题
 */

import React, { useRef } from 'react'
import { View, Pressable, Animated } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import themeState from '@/store/theme/state'
import { ThemeFrameworkType } from '@/theme/ThemeFramework'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'

export interface QuickActionCardProps {
  icon: string
  title: string
  subtitle?: string
  gradient?: [string, string]
  onPress: () => void
}

export default function QuickActionCard({
  icon,
  title,
  subtitle,
  gradient,
  onPress,
}: QuickActionCardProps) {
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

  const borderRadius = 8

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
            borderRadius,
            backgroundColor: gradient
              ? 'transparent'
              : theme['c-primary-light-400-alpha-700'],
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* 渐变背景（如果有） */}
        {gradient && (
          <View
            style={[
              styles.gradientBackground,
              {
                borderRadius,
                backgroundColor: theme['c-primary'],
                opacity: 0.8,
              },
            ]}
          />
        )}

        {/* 内容 */}
        <View style={styles.content}>
          {/* 图标 */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: gradient
                  ? 'rgba(255, 255, 255, 0.2)'
                  : theme['c-primary-light-200-alpha-700'],
                borderRadius: isMaterial ? 12 : 10,
              },
            ]}
          >
            <Icon
              name={icon}
              size={24}
              color={gradient ? '#FFFFFF' : theme['c-primary']}
            />
          </View>

          {/* 文字 */}
          <View style={styles.textContainer}>
            <Text
              size={15}
              color={gradient ? '#FFFFFF' : theme['c-font']}
              numberOfLines={1}
              style={styles.title}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                size={12}
                color={
                  gradient
                    ? 'rgba(255, 255, 255, 0.8)'
                    : theme['c-font-label']
                }
                numberOfLines={1}
                style={styles.subtitle}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  )
}

const styles = createStyle({
  container: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 16,
  },
})
