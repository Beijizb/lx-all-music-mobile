/**
 * 主题化列表项组件
 * 根据当前主题框架自动应用 Material 或 Cupertino 样式
 */

import React from 'react'
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { ThemeFrameworkType, getFrameworkStyles } from '@/theme/ThemeFramework'
import themeState from '@/store/theme/state'

interface ThemedListItemProps {
  /** 标题 */
  title: string
  /** 副标题 */
  subtitle?: string
  /** 左侧图标 */
  leftIcon?: React.ReactNode
  /** 右侧内容 */
  rightContent?: React.ReactNode
  /** 点击事件 */
  onPress?: () => void
  /** 是否显示分隔线 */
  showDivider?: boolean
  /** 自定义样式 */
  style?: ViewStyle
}

export const ThemedListItem: React.FC<ThemedListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightContent,
  onPress,
  showDivider = true,
  style,
}) => {
  const theme = useTheme()
  const framework = themeState.framework
  const frameworkStyles = getFrameworkStyles(framework)

  const getContainerStyle = (): ViewStyle => {
    return {
      minHeight: frameworkStyles.listItem.height,
      paddingHorizontal: frameworkStyles.listItem.paddingHorizontal,
      paddingVertical: framework === ThemeFrameworkType.CUPERTINO ? 12 : 8,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme['c-content-background'],
    }
  }

  const getTitleStyle = (): TextStyle => {
    return {
      fontFamily: frameworkStyles.typography.fontFamily,
      fontWeight: frameworkStyles.typography.fontWeights.regular,
      fontSize: framework === ThemeFrameworkType.CUPERTINO ? 17 : 16,
      color: theme['c-font'],
    }
  }

  const getSubtitleStyle = (): TextStyle => {
    return {
      fontFamily: frameworkStyles.typography.fontFamily,
      fontWeight: frameworkStyles.typography.fontWeights.regular,
      fontSize: framework === ThemeFrameworkType.CUPERTINO ? 15 : 14,
      color: theme['c-font-label'],
      marginTop: 2,
    }
  }

  const content = (
    <>
      <View style={styles.container}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <View style={styles.textContainer}>
          <Text style={getTitleStyle()} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={getSubtitleStyle()} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
      </View>
      {showDivider && (
        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme['c-200'],
              marginLeft: leftIcon ? 56 : 16,
            },
          ]}
        />
      )}
    </>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        style={[getContainerStyle(), style]}
        onPress={onPress}
        activeOpacity={framework === ThemeFrameworkType.CUPERTINO ? 0.6 : 0.7}
      >
        {content}
      </TouchableOpacity>
    )
  }

  return <View style={[getContainerStyle(), style]}>{content}</View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    marginRight: 16,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  rightContent: {
    marginLeft: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
})
