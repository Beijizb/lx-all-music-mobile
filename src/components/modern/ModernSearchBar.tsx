/**
 * ModernSearchBar - 现代化搜索框组件
 *
 * 特性：
 * - 圆角设计
 * - 搜索图标
 * - 清除按钮
 * - 自适应主题
 * - 聚焦动画
 */

import React, { useState, useRef } from 'react'
import { View, TextInput, Pressable, Animated } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import themeState from '@/store/theme/state'
import { ThemeFrameworkType } from '@/theme/ThemeFramework'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'

export interface ModernSearchBarProps {
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  onSubmit?: (text: string) => void
  onFocus?: () => void
  onBlur?: () => void
  autoFocus?: boolean
}

export default function ModernSearchBar({
  placeholder = '搜索歌曲、歌手、专辑',
  value,
  onChangeText,
  onSubmit,
  onFocus,
  onBlur,
  autoFocus = false,
}: ModernSearchBarProps) {
  const theme = useTheme()
  const framework = themeState.framework
  const [isFocused, setIsFocused] = useState(false)
  const [inputValue, setInputValue] = useState(value || '')
  const scaleAnim = useRef(new Animated.Value(1)).current

  const isMaterial = framework === ThemeFrameworkType.MATERIAL
  const borderRadius = isMaterial ? 24 : 20

  const handleFocus = () => {
    setIsFocused(true)
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start()
    onFocus?.()
  }

  const handleBlur = () => {
    setIsFocused(false)
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start()
    onBlur?.()
  }

  const handleChangeText = (text: string) => {
    setInputValue(text)
    onChangeText?.(text)
  }

  const handleClear = () => {
    setInputValue('')
    onChangeText?.('')
  }

  const handleSubmit = () => {
    onSubmit?.(inputValue)
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderRadius,
          backgroundColor: theme['c-primary-light-400-alpha-700'],
          borderWidth: isFocused ? 2 : 0,
          borderColor: isFocused ? theme['c-primary'] : 'transparent',
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* 搜索图标 */}
      <Icon
        name="search-2"
        size={20}
        color={isFocused ? theme['c-primary'] : theme['c-font-label']}
        style={styles.searchIcon}
      />

      {/* 输入框 */}
      <TextInput
        value={inputValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={handleSubmit}
        placeholder={placeholder}
        placeholderTextColor={theme['c-font-label']}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={[
          styles.input,
          {
            color: theme['c-font'],
            fontSize: 16,
          },
        ]}
      />

      {/* 清除按钮 */}
      {inputValue.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={10}>
          <Icon
            name="close-circle"
            size={20}
            color={theme['c-font-label']}
            style={styles.clearIcon}
          />
        </Pressable>
      )}
    </Animated.View>
  )
}

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
  },
  clearIcon: {
    marginLeft: 8,
  },
})
