/**
 * ModernCard - 现代化卡片组件
 * 支持 Material Design 和 iOS Cupertino 两种风格
 *
 * 特性：
 * - 多种变体：elevated, filled, outlined, glass
 * - 按压缩放动画
 * - 自适应主题框架
 */

import React, { useRef } from 'react'
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native'
import { useTheme } from '@/store/theme/hook'
import themeState from '@/store/theme/state'
import { ThemeFrameworkType } from '@/theme/ThemeFramework'

export interface ModernCardProps {
  children: React.ReactNode
  variant?: 'elevated' | 'filled' | 'outlined' | 'glass'
  pressScale?: number
  elevation?: 0 | 1 | 2 | 3 | 4 | 5
  onPress?: () => void
  onLongPress?: () => void
  style?: StyleProp<ViewStyle>
  disabled?: boolean
}

export default function ModernCard({
  children,
  variant = 'elevated',
  pressScale = 0.97,
  elevation = 2,
  onPress,
  onLongPress,
  style,
  disabled = false,
}: ModernCardProps) {
  const theme = useTheme()
  const framework = themeState.framework
  const scaleAnim = useRef(new Animated.Value(1)).current

  const isMaterial = framework === ThemeFrameworkType.MATERIAL

  // 按压动画
  const handlePressIn = () => {
    if (disabled || !onPress) return
    Animated.spring(scaleAnim, {
      toValue: pressScale,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start()
  }

  const handlePressOut = () => {
    if (disabled || !onPress) return
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start()
  }

  // 获取框架特定的样式
  const getFrameworkStyles = (): ViewStyle => {
    const baseRadius = isMaterial ? 16 : 14

    if (variant === 'elevated') {
      if (isMaterial) {
        return {
          borderRadius: baseRadius,
          backgroundColor: theme['c-content-background'],
          ...getMaterialElevation(elevation),
        }
      } else {
        return {
          borderRadius: baseRadius,
          backgroundColor: theme['c-content-background'],
          ...getCupertinoShadow(),
        }
      }
    }

    if (variant === 'filled') {
      return {
        borderRadius: baseRadius,
        backgroundColor: theme['c-primary-light-400-alpha-700'],
      }
    }

    if (variant === 'outlined') {
      return {
        borderRadius: baseRadius,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme['c-primary-light-200-alpha-700'],
      }
    }

    if (variant === 'glass') {
      return {
        borderRadius: baseRadius,
        backgroundColor: theme['c-content-background'] + '80', // 50% opacity
        borderWidth: 1,
        borderColor: theme['c-primary-light-200-alpha-700'],
        ...getCupertinoShadow(),
      }
    }

    return {}
  }

  // Material Design 阴影
  const getMaterialElevation = (level: number): ViewStyle => {
    const elevations = {
      0: {},
      1: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      },
      2: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
      },
      3: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
        elevation: 6,
      },
      4: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.20,
        shadowRadius: 16,
        elevation: 8,
      },
      5: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.24,
        shadowRadius: 20,
        elevation: 10,
      },
    }
    return elevations[level] || elevations[2]
  }

  // Cupertino 阴影
  const getCupertinoShadow = (): ViewStyle => {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
    }
  }

  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        getFrameworkStyles(),
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  )

  // 如果有交互
  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[{ opacity: disabled ? 0.5 : 1 }]}
      >
        {cardContent}
      </Pressable>
    )
  }

  return cardContent
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
})
