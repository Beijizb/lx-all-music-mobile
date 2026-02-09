/**
 * 主题化卡片组件
 * 根据当前主题框架自动应用 Material 或 Cupertino 样式
 */

import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { ThemeFrameworkType, getFrameworkStyles } from '@/theme/ThemeFramework'
import themeState from '@/store/theme/state'

interface ThemedCardProps {
  /** 子组件 */
  children: React.ReactNode
  /** 自定义样式 */
  style?: ViewStyle
  /** 是否显示阴影 */
  elevated?: boolean
}

export const ThemedCard: React.FC<ThemedCardProps> = ({
  children,
  style,
  elevated = true,
}) => {
  const theme = useTheme()
  const framework = themeState.framework
  const frameworkStyles = getFrameworkStyles(framework)

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme['c-content-background'],
      padding: 16,
      borderRadius: frameworkStyles.borderRadius.medium,
    }

    if (elevated) {
      return {
        ...baseStyle,
        ...frameworkStyles.elevation.level2,
      }
    }

    // Cupertino 风格即使不显示阴影也有边框
    if (framework === ThemeFrameworkType.CUPERTINO && !elevated) {
      return {
        ...baseStyle,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme['c-200'],
      }
    }

    return baseStyle
  }

  return <View style={[getCardStyle(), style]}>{children}</View>
}
