/**
 * MeshGradientBackground - 简化版动态渐变背景
 *
 * 特性：
 * - 基于主题色的静态渐变
 * - 轻量级实现，避免复杂动画
 * - 性能优化
 */

import { memo } from 'react'
import { View, StyleSheet } from 'react-native'

interface MeshGradientBackgroundProps {
  colors?: string[]
  animated?: boolean
}

export default memo(({
  colors = ['#4DAFB4', '#9B59B6', '#E74C3C', '#F39C12', '#2ECC71'],
}: MeshGradientBackgroundProps) => {
  return (
    <View style={styles.container}>
      {/* 静态渐变光斑 */}
      <View style={styles.blobContainer}>
        <View
          style={[
            styles.blob,
            {
              width: 300,
              height: 300,
              borderRadius: 150,
              backgroundColor: colors[0],
              top: '10%',
              left: '10%',
              opacity: 0.6,
            },
          ]}
        />
        <View
          style={[
            styles.blob,
            {
              width: 350,
              height: 350,
              borderRadius: 175,
              backgroundColor: colors[1],
              top: '5%',
              right: '5%',
              opacity: 0.5,
            },
          ]}
        />
        <View
          style={[
            styles.blob,
            {
              width: 280,
              height: 280,
              borderRadius: 140,
              backgroundColor: colors[2],
              bottom: '15%',
              left: '40%',
              opacity: 0.55,
            },
          ]}
        />
        <View
          style={[
            styles.blob,
            {
              width: 320,
              height: 320,
              borderRadius: 160,
              backgroundColor: colors[3],
              bottom: '10%',
              left: '5%',
              opacity: 0.5,
            },
          ]}
        />
        <View
          style={[
            styles.blob,
            {
              width: 290,
              height: 290,
              borderRadius: 145,
              backgroundColor: colors[4],
              top: '40%',
              right: '10%',
              opacity: 0.6,
            },
          ]}
        />
      </View>

      {/* 半透明遮罩层 */}
      <View style={styles.overlay} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
})
