/**
 * MeshGradientBackground - 动态网格渐变背景
 *
 * 灵感来自 Apple Music 的流体云设计
 * 特性：
 * - 基于专辑封面提取颜色
 * - 多个动态光斑
 * - 流畅的移动和缩放动画
 * - 渐变混合效果
 */

import { memo, useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, Dimensions } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface MeshGradientBackgroundProps {
  colors?: string[]
  animated?: boolean
}

export default memo(({
  colors = ['#4DAFB4', '#9B59B6', '#E74C3C', '#F39C12', '#2ECC71'],
  animated = true
}: MeshGradientBackgroundProps) => {
  // 5个光斑的动画值
  const blob1Pos = useRef(new Animated.ValueXY({ x: 0.2, y: 0.3 })).current
  const blob2Pos = useRef(new Animated.ValueXY({ x: 0.8, y: 0.2 })).current
  const blob3Pos = useRef(new Animated.ValueXY({ x: 0.5, y: 0.7 })).current
  const blob4Pos = useRef(new Animated.ValueXY({ x: 0.1, y: 0.8 })).current
  const blob5Pos = useRef(new Animated.ValueXY({ x: 0.9, y: 0.6 })).current

  const blob1Scale = useRef(new Animated.Value(1)).current
  const blob2Scale = useRef(new Animated.Value(1)).current
  const blob3Scale = useRef(new Animated.Value(1)).current
  const blob4Scale = useRef(new Animated.Value(1)).current
  const blob5Scale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!animated) return

    // 创建循环动画
    const createLoopAnimation = (
      posAnim: Animated.ValueXY,
      scaleAnim: Animated.Value,
      duration: number,
      delay: number
    ) => {
      return Animated.loop(
        Animated.parallel([
          // 位置动画
          Animated.sequence([
            Animated.timing(posAnim, {
              toValue: {
                x: Math.random() * 0.6 + 0.2,
                y: Math.random() * 0.6 + 0.2
              },
              duration: duration,
              delay: delay,
              useNativeDriver: true,
            }),
          ]),
          // 缩放动画
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 0.8 + Math.random() * 0.4,
              duration: duration / 2,
              delay: delay,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ]),
        ])
      )
    }

    // 启动所有动画
    const animations = [
      createLoopAnimation(blob1Pos, blob1Scale, 8000, 0),
      createLoopAnimation(blob2Pos, blob2Scale, 10000, 1000),
      createLoopAnimation(blob3Pos, blob3Scale, 9000, 2000),
      createLoopAnimation(blob4Pos, blob4Scale, 11000, 1500),
      createLoopAnimation(blob5Pos, blob5Scale, 7000, 500),
    ]

    animations.forEach(anim => anim.start())

    return () => {
      animations.forEach(anim => anim.stop())
    }
  }, [animated])

  const renderBlob = (
    posAnim: Animated.ValueXY,
    scaleAnim: Animated.Value,
    color: string,
    size: number,
    blurRadius: number
  ) => {
    return (
      <Animated.View
        style={[
          styles.blob,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [
              {
                translateX: posAnim.x.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN_WIDTH],
                }),
              },
              {
                translateY: posAnim.y.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN_HEIGHT],
                }),
              },
              { scale: scaleAnim },
            ],
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: blurRadius,
          },
        ]}
      />
    )
  }

  return (
    <View style={styles.container}>
      {/* 渐变光斑层 */}
      <View style={styles.blobContainer}>
        {renderBlob(blob1Pos, blob1Scale, colors[0], 300, 60)}
        {renderBlob(blob2Pos, blob2Scale, colors[1], 350, 70)}
        {renderBlob(blob3Pos, blob3Scale, colors[2], 280, 55)}
        {renderBlob(blob4Pos, blob4Scale, colors[3], 320, 65)}
        {renderBlob(blob5Pos, blob5Scale, colors[4], 290, 58)}
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
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
})
