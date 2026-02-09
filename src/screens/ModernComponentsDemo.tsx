/**
 * ModernComponentsDemo - 现代化组件演示页面
 * 展示所有新的现代化组件
 */

import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { ModernCard, ModernButton, ModernListItem } from '@/components/modern'

export default function ModernComponentsDemo() {
  const theme = useTheme()

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme['c-app-background'] }]}
      contentContainerStyle={styles.content}
    >
      {/* 标题 */}
      <Text size={28} color={theme['c-font']} style={styles.title}>
        现代化组件演示
      </Text>

      {/* ModernCard 演示 */}
      <View style={styles.section}>
        <Text size={20} color={theme['c-font']} style={styles.sectionTitle}>
          ModernCard 卡片
        </Text>

        <ModernCard variant="elevated" style={styles.card}>
          <Text size={16} color={theme['c-font']}>
            Elevated Card - 带阴影的卡片
          </Text>
          <Text size={14} color={theme['c-font-label']} style={styles.cardDesc}>
            适合展示重要内容
          </Text>
        </ModernCard>

        <ModernCard variant="filled" style={styles.card}>
          <Text size={16} color={theme['c-font']}>
            Filled Card - 填充卡片
          </Text>
          <Text size={14} color={theme['c-font-label']} style={styles.cardDesc}>
            使用主题色背景
          </Text>
        </ModernCard>

        <ModernCard variant="outlined" style={styles.card}>
          <Text size={16} color={theme['c-font']}>
            Outlined Card - 描边卡片
          </Text>
          <Text size={14} color={theme['c-font-label']} style={styles.cardDesc}>
            轻量级边框设计
          </Text>
        </ModernCard>

        <ModernCard variant="glass" style={styles.card}>
          <Text size={16} color={theme['c-font']}>
            Glass Card - 玻璃卡片
          </Text>
          <Text size={14} color={theme['c-font-label']} style={styles.cardDesc}>
            半透明毛玻璃效果
          </Text>
        </ModernCard>

        <ModernCard
          variant="elevated"
          onPress={() => console.log('Card pressed')}
          style={styles.card}
        >
          <Text size={16} color={theme['c-font']}>
            可点击卡片
          </Text>
          <Text size={14} color={theme['c-font-label']} style={styles.cardDesc}>
            点击我试试，有按压动画
          </Text>
        </ModernCard>
      </View>

      {/* ModernButton 演示 */}
      <View style={styles.section}>
        <Text size={20} color={theme['c-font']} style={styles.sectionTitle}>
          ModernButton 按钮
        </Text>

        <View style={styles.buttonRow}>
          <ModernButton
            variant="primary"
            size="large"
            onPress={() => console.log('Primary button')}
          >
            Primary Large
          </ModernButton>
        </View>

        <View style={styles.buttonRow}>
          <ModernButton
            variant="primary"
            size="medium"
            onPress={() => console.log('Primary button')}
          >
            Primary Medium
          </ModernButton>
          <ModernButton
            variant="secondary"
            size="medium"
            onPress={() => console.log('Secondary button')}
          >
            Secondary
          </ModernButton>
        </View>

        <View style={styles.buttonRow}>
          <ModernButton
            variant="primary"
            size="small"
            onPress={() => console.log('Small button')}
          >
            Small
          </ModernButton>
          <ModernButton
            variant="ghost"
            size="small"
            onPress={() => console.log('Ghost button')}
          >
            Ghost
          </ModernButton>
          <ModernButton
            variant="icon"
            size="small"
            icon="heart"
            onPress={() => console.log('Icon button')}
          />
        </View>

        <View style={styles.buttonRow}>
          <ModernButton
            variant="primary"
            icon="play"
            onPress={() => console.log('Button with icon')}
          >
            播放全部
          </ModernButton>
          <ModernButton
            variant="primary"
            loading
            onPress={() => console.log('Loading button')}
          >
            加载中
          </ModernButton>
        </View>

        <View style={styles.buttonRow}>
          <ModernButton
            variant="primary"
            disabled
            onPress={() => console.log('Disabled button')}
          >
            禁用状态
          </ModernButton>
        </View>
      </View>

      {/* ModernListItem 演示 */}
      <View style={styles.section}>
        <Text size={20} color={theme['c-font']} style={styles.sectionTitle}>
          ModernListItem 列表项
        </Text>

        <ModernCard variant="elevated">
          <ModernListItem
            title="夜曲"
            subtitle="周杰伦 · 十一月的萧邦"
            coverUri="https://p1.music.126.net/example.jpg"
            coverSize={70}
            showBadge
            badgeType="sq"
            showDuration
            duration="3:45"
            onPress={() => console.log('Song pressed')}
            onMorePress={() => console.log('More pressed')}
          />

          <ModernListItem
            title="稻香"
            subtitle="周杰伦 · 魔杰座"
            coverSize={70}
            showBadge
            badgeType="hq"
            showDuration
            duration="4:12"
            onPress={() => console.log('Song pressed')}
            onMorePress={() => console.log('More pressed')}
          />

          <ModernListItem
            title="晴天"
            subtitle="周杰伦 · 叶惠美"
            coverSize={70}
            showIndex
            index={1}
            showDuration
            duration="4:28"
            onPress={() => console.log('Song pressed')}
            onMorePress={() => console.log('More pressed')}
          />

          <ModernListItem
            title="七里香"
            subtitle="周杰伦 · 七里香"
            coverSize={80}
            showBadge
            badgeType="vip"
            showDuration
            duration="5:05"
            onPress={() => console.log('Song pressed')}
            onMorePress={() => console.log('More pressed')}
          />
        </ModernCard>
      </View>

      {/* 底部间距 */}
      <View style={{ height: 100 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  card: {
    padding: 16,
    marginBottom: 12,
  },
  cardDesc: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
})
