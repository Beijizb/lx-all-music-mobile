/**
 * ModernButton - 现代化按钮组件
 * 支持 Material Design 和 iOS Cupertino 两种风格
 *
 * 特性：
 * - 多种变体：primary, secondary, ghost, icon
 * - 多种尺寸：small, medium, large
 * - 加载状态
 * - 按压动画
 * - 波纹效果（Material）
 */

import React, { useRef } from 'react'
import {
  Pressable,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
} from 'react-native'
import { useTheme } from '@/store/theme/hook'
import themeState from '@/store/theme/state'
import { ThemeFrameworkType } from '@/theme/ThemeFramework'
import Text from '@/components/common/Text'
import Icon from '@/components/common/Icon'

export interface ModernButtonProps {
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
  icon?: string
  iconSize?: number
  onPress?: () => void
  onLongPress?: () => void
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export default function ModernButton({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconSize,
  onPress,
  onLongPress,
  style,
  textStyle,
}: ModernButtonProps) {
  const theme = useTheme()
  const framework = themeState.framework
  const scaleAnim = useRef(new Animated.Value(1)).current

  const isMaterial = framework === ThemeFrameworkType.MATERIAL
  const isDisabled = disabled || loading

  // 按压动画
  const handlePressIn = () => {
    if (isDisabled) return
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start()
  }

  const handlePressOut = () => {
    if (isDisabled) return
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start()
  }

  // 获取尺寸样式
  const getSizeStyles = (): ViewStyle & TextStyle => {
    const sizes = {
      small: {
        height: 32,
        paddingHorizontal: 12,
        fontSize: 14,
        borderRadius: isMaterial ? 16 : 8,
      },
      medium: {
        height: 44,
        paddingHorizontal: 20,
        fontSize: 16,
        borderRadius: isMaterial ? 22 : 10,
      },
      large: {
        height: 56,
        paddingHorizontal: 32,
        fontSize: 18,
        borderRadius: isMaterial ? 28 : 12,
      },
    }
    return sizes[size]
  }

  // 获取变体样式
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    const sizeStyles = getSizeStyles()

    if (variant === 'primary') {
      return {
        container: {
          backgroundColor: theme['c-primary'],
          ...sizeStyles,
        },
        text: {
          color: '#FFFFFF',
          fontSize: sizeStyles.fontSize,
          fontWeight: '600',
        },
      }
    }

    if (variant === 'secondary') {
      return {
        container: {
          backgroundColor: theme['c-primary-light-400-alpha-700'],
          ...sizeStyles,
        },
        text: {
          color: theme['c-primary'],
          fontSize: sizeStyles.fontSize,
          fontWeight: '600',
        },
      }
    }

    if (variant === 'ghost') {
      return {
        container: {
          backgroundColor: 'transparent',
          ...sizeStyles,
        },
        text: {
          color: theme['c-primary'],
          fontSize: sizeStyles.fontSize,
          fontWeight: '500',
        },
      }
    }

    if (variant === 'icon') {
      const iconButtonSize = sizeStyles.height
      return {
        container: {
          width: iconButtonSize,
          height: iconButtonSize,
          borderRadius: iconButtonSize / 2,
          backgroundColor: theme['c-primary-light-400-alpha-700'],
          paddingHorizontal: 0,
        },
        text: {
          color: theme['c-primary'],
          fontSize: sizeStyles.fontSize,
        },
      }
    }

    return {
      container: sizeStyles,
      text: { fontSize: sizeStyles.fontSize },
    }
  }

  const variantStyles = getVariantStyles()

  // 渲染内容
  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : theme['c-primary']}
        />
      )
    }

    if (icon && !children) {
      return (
        <Icon
          name={icon}
          size={iconSize || variantStyles.text.fontSize * 1.2}
          color={variantStyles.text.color}
        />
      )
    }

    if (icon && children) {
      return (
        <>
          <Icon
            name={icon}
            size={iconSize || variantStyles.text.fontSize * 1.2}
            color={variantStyles.text.color}
            style={styles.iconWithText}
          />
          <Text style={[variantStyles.text, textStyle]}>{children}</Text>
        </>
      )
    }

    return <Text style={[variantStyles.text, textStyle]}>{children}</Text>
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      android_ripple={
        isMaterial && !isDisabled
          ? {
              color: theme['c-primary-light-200-alpha-700'],
              borderless: false,
            }
          : undefined
      }
      style={[{ opacity: isDisabled ? 0.5 : 1 }]}
    >
      <Animated.View
        style={[
          styles.button,
          variantStyles.container,
          { transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        {renderContent()}
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconWithText: {
    marginRight: 8,
  },
})
