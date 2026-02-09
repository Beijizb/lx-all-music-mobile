/**
 * 主题框架集成示例
 * 展示如何在现有页面中集成主题框架系统
 */

import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import {
  ThemedButton,
  ThemedCard,
  ThemedListItem,
  ThemeFrameworkSetting,
} from '@/theme/ThemeFrameworkExports'

/**
 * 示例：设置页面中添加主题框架选项
 */
export const SettingsPageExample: React.FC = () => {
  const theme = useTheme()

  return (
    <ScrollView style={styles.container}>
      {/* 其他设置项 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
          外观设置
        </Text>
      </View>

      {/* 主题框架设置 */}
      <ThemeFrameworkSetting />

      {/* 其他设置项 */}
    </ScrollView>
  )
}

/**
 * 示例：使用主题化组件构建页面
 */
export const ThemedPageExample: React.FC = () => {
  const theme = useTheme()

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={[styles.title, { color: theme['c-font'] }]}>
          主题化组件示例
        </Text>
      </View>

      {/* 按钮示例 */}
      <ThemedCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme['c-font'] }]}>
          按钮样式
        </Text>
        <View style={styles.buttonRow}>
          <ThemedButton
            title="填充"
            onPress={() => console.log('填充按钮')}
            variant="filled"
            style={styles.button}
          />
          <ThemedButton
            title="描边"
            onPress={() => console.log('描边按钮')}
            variant="outlined"
            style={styles.button}
          />
          <ThemedButton
            title="文本"
            onPress={() => console.log('文本按钮')}
            variant="text"
            style={styles.button}
          />
        </View>
      </ThemedCard>

      {/* 列表示例 */}
      <ThemedCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme['c-font'] }]}>
          列表样式
        </Text>
        <ThemedListItem
          title="音乐库"
          subtitle="查看所有音乐"
          leftIcon={<Text>🎵</Text>}
          onPress={() => console.log('音乐库')}
        />
        <ThemedListItem
          title="播放列表"
          subtitle="管理播放列表"
          leftIcon={<Text>📝</Text>}
          onPress={() => console.log('播放列表')}
        />
        <ThemedListItem
          title="下载管理"
          subtitle="查看下载内容"
          leftIcon={<Text>⬇️</Text>}
          onPress={() => console.log('下载管理')}
          showDivider={false}
        />
      </ThemedCard>

      {/* 卡片示例 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
          卡片样式
        </Text>
      </View>

      <ThemedCard elevated={true} style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme['c-font'] }]}>
          带阴影的卡片
        </Text>
        <Text style={[styles.cardDescription, { color: theme['c-font-label'] }]}>
          这是一个带有阴影效果的卡片，Material Design 的阴影更明显，
          iOS 风格的阴影更轻。
        </Text>
      </ThemedCard>

      <ThemedCard elevated={false} style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme['c-font'] }]}>
          无阴影的卡片
        </Text>
        <Text style={[styles.cardDescription, { color: theme['c-font-label'] }]}>
          这是一个无阴影的卡片，iOS 风格会显示边框。
        </Text>
      </ThemedCard>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
})
