/**
 * 主题框架设置组件
 * 允许用户在 Material Design 和 iOS Cupertino 风格之间切换
 */

import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import themeState from '@/store/theme/state'
import themeAction from '@/store/theme/action'
import {
  ThemeFrameworkType,
  THEME_FRAMEWORKS,
  getRecommendedFramework,
} from '@/theme/ThemeFramework'
import { ThemedCard } from '@/components/common/ThemedCard'
import { ThemedListItem } from '@/components/common/ThemedListItem'
import { ThemedButton } from '@/components/common/ThemedButton'
import { setSetting } from '@/core/common'

export const ThemeFrameworkSetting: React.FC = () => {
  const theme = useTheme()
  const [currentFramework, setCurrentFramework] = useState<ThemeFrameworkType>(
    themeState.framework
  )

  const handleFrameworkChange = async (framework: ThemeFrameworkType) => {
    setCurrentFramework(framework)
    themeAction.setFramework(framework)

    // 保存到设置
    await setSetting({
      'theme.framework': framework,
    })
  }

  const handleResetToRecommended = async () => {
    const recommended = getRecommendedFramework()
    handleFrameworkChange(recommended)
  }

  const recommendedFramework = getRecommendedFramework()

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
          主题框架
        </Text>
        <Text style={[styles.sectionDescription, { color: theme['c-font-label'] }]}>
          选择应用的设计风格。Material Design 适合 Android 用户，iOS 风格适合 iPhone 用户。
        </Text>
      </View>

      <ThemedCard style={styles.card}>
        {THEME_FRAMEWORKS.map((framework, index) => {
          const isSelected = currentFramework === framework.type
          const isRecommended = framework.type === recommendedFramework

          return (
            <ThemedListItem
              key={framework.type}
              title={framework.name}
              subtitle={`${framework.description}${
                isRecommended ? ' • 推荐' : ''
              }`}
              rightContent={
                isSelected ? (
                  <View
                    style={[
                      styles.checkmark,
                      { backgroundColor: theme['c-primary'] },
                    ]}
                  >
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                ) : null
              }
              onPress={() => handleFrameworkChange(framework.type)}
              showDivider={index < THEME_FRAMEWORKS.length - 1}
            />
          )
        })}
      </ThemedCard>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
          预览效果
        </Text>
      </View>

      <ThemedCard style={styles.previewCard}>
        <Text style={[styles.previewTitle, { color: theme['c-font'] }]}>
          当前框架：{THEME_FRAMEWORKS.find(f => f.type === currentFramework)?.name}
        </Text>
        <Text style={[styles.previewDescription, { color: theme['c-font-label'] }]}>
          {currentFramework === ThemeFrameworkType.MATERIAL
            ? '使用 Material Design 风格，圆角较小，阴影较明显，适合 Android 平台。'
            : '使用 iOS Cupertino 风格，圆角较大，阴影较轻，适合 iOS 平台。'}
        </Text>

        <View style={styles.buttonRow}>
          <ThemedButton
            title="填充按钮"
            onPress={() => {}}
            variant="filled"
            style={styles.button}
          />
          <ThemedButton
            title="描边按钮"
            onPress={() => {}}
            variant="outlined"
            style={styles.button}
          />
        </View>
      </ThemedCard>

      {currentFramework !== recommendedFramework && (
        <View style={styles.section}>
          <ThemedButton
            title={`恢复为推荐设置（${Platform.OS === 'ios' ? 'iOS 风格' : 'Material Design'}）`}
            onPress={handleResetToRecommended}
            variant="outlined"
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.hint, { color: theme['c-font-label'] }]}>
          💡 提示：更改主题框架后，应用的按钮、列表、卡片等组件样式会立即更新。
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
})
