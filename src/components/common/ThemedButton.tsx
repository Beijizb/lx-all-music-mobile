/**
 * 主题化按钮组件
 * 根据当前主题框架自动应用 Material 或 Cupertino 样式
 */

import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { ThemeFrameworkType, getFrameworkStyles } from '@/theme/ThemeFramework'
import themeState from '@/store/theme/state'

interface ThemedButtonProps {
  /** 按钮文本 */
  title: string
  /** 点击事件 */
  onPress: () => void
  /** 按钮类型 */
  variant?: 'filled' | 'outlined' | 'text'
  /** 是否禁用 */
  disabled?: boolean
  /** 是否显示加载状态 */
  loading?: boolean
  /** 自定义样式 */
  style?: ViewStyle
  /** 自定义文本样式 */
  textStyle?: TextStyle
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  title,
  onPress,
  variant = 'filled',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const theme = useTheme()
  const framework = themeState.framework
  const frameworkStyles = getFrameworkStyles(framework)

  // 根据框架和变体获取样式
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: frameworkStyles.button.height,
      minWidth: frameworkStyles.button.minWidth,
      paddingHorizontal: frameworkStyles.button.paddingHorizontal,
      borderRadius: frameworkStyles.button.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    }

    if (disabled) {
      return {
        ...baseStyle,
        backgroundColor: theme['c-300'],
        opacity: 0.5,
      }
    }

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme['c-primary'],
          ...frameworkStyles.elevation.level2,
        }
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: framework === ThemeFrameworkType.CUPERTINO ? 1 : 1.5,
          borderColor: theme['c-primary'],
        }
      case 'text':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        }
      default:
        return baseStyle
    }
  }

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontFamily: frameworkStyles.typography.fontFamily,
      fontWeight: frameworkStyles.typography.fontWeights.medium,
      fontSize: framework === ThemeFrameworkType.CUPERTINO ? 17 : 14,
    }

    if (disabled) {
      return {
        ...baseTextStyle,
        color: theme['c-600'],
      }
    }

    switch (variant) {
      case 'filled':
        return {
          ...baseTextStyle,
          color: '#FFFFFF',
        }
      case 'outlined':
      case 'text':
        return {
          ...baseTextStyle,
          color: theme['c-primary'],
        }
      default:
        return baseTextStyle
    }
  }

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={framework === ThemeFrameworkType.CUPERTINO ? 0.6 : 0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'filled' ? '#FFFFFF' : theme['c-primary']}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({})
