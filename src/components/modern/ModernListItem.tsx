/**
 * ModernListItem - 现代化列表项组件
 * 支持 Material Design 和 iOS Cupertino 两种风格
 *
 * 特性：
 * - 可配置封面大小
 * - 音质徽章显示
 * - 序号显示
 * - 按压动画
 * - 长按菜单
 */

import React, { useRef, type Ref } from 'react'
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
} from 'react-native'
import { useTheme } from '@/store/theme/hook'
import themeState from '@/store/theme/state'
import { ThemeFrameworkType } from '@/theme/ThemeFramework'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'
import Badge from '@/components/common/Badge'

export type BadgeType = 'normal' | 'sq' | 'hq' | 'vip'

export interface ModernListItemProps {
  // 基本信息
  title: string
  subtitle?: string
  coverUri?: string

  // 显示选项
  coverSize?: 60 | 70 | 80
  showBadge?: boolean
  badgeType?: BadgeType
  showIndex?: boolean
  index?: number
  showDuration?: boolean
  duration?: string

  // 状态
  isActive?: boolean
  isSelected?: boolean

  // 交互
  onPress?: () => void
  onLongPress?: () => void
  onMorePress?: () => void
  moreButtonRef?: Ref<TouchableOpacity>

  // 样式
  style?: StyleProp<ViewStyle>
  disabled?: boolean
}

export default function ModernListItem({
  title,
  subtitle,
  coverUri,
  coverSize = 70,
  showBadge = false,
  badgeType = 'normal',
  showIndex = false,
  index,
  showDuration = true,
  duration,
  isActive = false,
  isSelected = false,
  onPress,
  onLongPress,
  onMorePress,
  moreButtonRef,
  style,
  disabled = false,
}: ModernListItemProps) {
  const theme = useTheme()
  const framework = themeState.framework
  const scaleAnim = useRef(new Animated.Value(1)).current

  const isMaterial = framework === ThemeFrameworkType.MATERIAL

  // 按压动画
  const handlePressIn = () => {
    if (disabled) return
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start()
  }

  const handlePressOut = () => {
    if (disabled) return
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start()
  }

  // 获取框架特定样式
  const getFrameworkStyles = () => {
    return {
      borderRadius: isMaterial ? 12 : 10,
      paddingHorizontal: isMaterial ? 16 : 12,
      paddingVertical: isMaterial ? 8 : 6,
    }
  }

  const frameworkStyles = getFrameworkStyles()

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      android_ripple={
        isMaterial && !disabled
          ? {
              color: theme['c-primary-light-200-alpha-700'],
              borderless: false,
            }
          : undefined
      }
      style={[{ opacity: disabled ? 0.5 : 1 }]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            paddingHorizontal: frameworkStyles.paddingHorizontal,
            paddingVertical: frameworkStyles.paddingVertical,
            backgroundColor: isSelected
              ? theme['c-primary-background-hover']
              : 'transparent',
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        {/* 序号 */}
        {showIndex && index !== undefined && (
          <View style={styles.indexContainer}>
            <Text
              size={14}
              color={
                isActive ? theme['c-primary-font'] : theme['c-font-label']
              }
              style={styles.indexText}
            >
              {index}
            </Text>
          </View>
        )}

        {/* 封面 */}
        <View
          style={[
            styles.coverContainer,
            {
              width: coverSize,
              height: coverSize,
              borderRadius: frameworkStyles.borderRadius,
            },
          ]}
        >
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={[
                styles.cover,
                { borderRadius: frameworkStyles.borderRadius },
              ]}
            />
          ) : (
            <View
              style={[
                styles.coverPlaceholder,
                {
                  borderRadius: frameworkStyles.borderRadius,
                  backgroundColor: theme['c-primary-light-400-alpha-700'],
                },
              ]}
            >
              <Icon
                name="music"
                size={coverSize * 0.4}
                color={theme['c-primary']}
              />
            </View>
          )}
        </View>

        {/* 信息区域 */}
        <View style={styles.infoContainer}>
          {/* 标题行 */}
          <View style={styles.titleRow}>
            <Text
              size={16}
              color={isActive ? theme['c-primary-font'] : theme['c-font']}
              numberOfLines={1}
              style={styles.title}
            >
              {title}
            </Text>
            {showBadge && (
              <Badge type={badgeType} style={styles.badge} />
            )}
          </View>

          {/* 副标题 */}
          {subtitle && (
            <Text
              size={14}
              color={theme['c-font-label']}
              numberOfLines={1}
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* 右侧区域 */}
        <View style={styles.rightContainer}>
          {/* 时长 */}
          {showDuration && duration && (
            <Text
              size={12}
              color={theme['c-font-label']}
              style={styles.duration}
            >
              {duration}
            </Text>
          )}

          {/* 更多按钮 */}
          {onMorePress && (
            <TouchableOpacity
              ref={moreButtonRef}
              onPress={onMorePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.moreButton}
            >
              <Icon
                name="more-vert"
                size={20}
                color={theme['c-font-label']}
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
  },
  indexContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 8,
  },
  indexText: {
    fontWeight: '500',
  },
  coverContainer: {
    overflow: 'hidden',
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
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontWeight: '500',
  },
  badge: {
    marginLeft: 6,
  },
  subtitle: {
    marginTop: 2,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 12,
  },
  duration: {
    marginBottom: 4,
  },
  moreButton: {
    padding: 4,
  },
})
