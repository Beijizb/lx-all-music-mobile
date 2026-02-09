/**
 * ModernProgress - 现代化进度条组件
 *
 * 新特性：
 * - 更粗的进度条（8px）
 * - 拖动时放大效果
 * - 显示缓冲进度
 * - 更好的触摸反馈
 */

import { memo, useRef, useState, useCallback } from 'react'
import { View, Animated, PanResponder } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import themeState from '@/store/theme/state'
import { ThemeFrameworkType } from '@/theme/ThemeFramework'
import Text from '@/components/common/Text'
import { usePlayerProgress, usePlayerBufferedProgress } from '@/store/player/hook'
import { seek } from '@/plugins/player'
import { formatPlayTime } from '@/utils'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const theme = useTheme()
  const framework = themeState.framework
  const progress = usePlayerProgress()
  const bufferedProgress = usePlayerBufferedProgress()

  const [isDragging, setIsDragging] = useState(false)
  const [tempProgress, setTempProgress] = useState(0)
  const scaleAnim = useRef(new Animated.Value(1)).current
  const containerWidth = useRef(0)

  const isMaterial = framework === ThemeFrameworkType.MATERIAL

  // 拖动手势
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        setIsDragging(true)
        // 拖动时放大
        Animated.spring(scaleAnim, {
          toValue: 1.5,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }).start()
      },

      onPanResponderMove: (_, gestureState) => {
        if (containerWidth.current > 0) {
          const newProgress = Math.max(
            0,
            Math.min(1, gestureState.moveX / containerWidth.current)
          )
          setTempProgress(newProgress)
        }
      },

      onPanResponderRelease: () => {
        setIsDragging(false)
        // 恢复原大小
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }).start()

        // 跳转到指定位置
        if (progress.maxTime > 0) {
          const seekTime = tempProgress * progress.maxTime
          seek(seekTime)
        }
      },
    })
  ).current

  const onLayout = useCallback((event: any) => {
    containerWidth.current = event.nativeEvent.layout.width
  }, [])

  const currentProgress = isDragging ? tempProgress : progress.progress
  const buffered = bufferedProgress.progress

  // 进度条高度
  const progressHeight = isMaterial ? 8 : 6

  return (
    <View style={styles.container}>
      {/* 时间显示 */}
      <View style={styles.timeRow}>
        <Text size={13} color={theme['c-font-label']}>
          {formatPlayTime(progress.nowTime)}
        </Text>
        <Text size={13} color={theme['c-font-label']}>
          {formatPlayTime(progress.maxTime)}
        </Text>
      </View>

      {/* 进度条 */}
      <View
        style={styles.progressContainer}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        {/* 背景轨道 */}
        <View
          style={[
            styles.progressTrack,
            {
              height: progressHeight,
              borderRadius: progressHeight / 2,
              backgroundColor: theme['c-primary-light-400-alpha-700'],
            },
          ]}
        >
          {/* 缓冲进度 */}
          <View
            style={[
              styles.progressBuffered,
              {
                width: `${buffered * 100}%`,
                height: progressHeight,
                borderRadius: progressHeight / 2,
                backgroundColor: theme['c-primary-light-200-alpha-700'],
              },
            ]}
          />

          {/* 播放进度 */}
          <View
            style={[
              styles.progressBar,
              {
                width: `${currentProgress * 100}%`,
                height: progressHeight,
                borderRadius: progressHeight / 2,
                backgroundColor: theme['c-primary'],
              },
            ]}
          />

          {/* 拖动指示器 */}
          <Animated.View
            style={[
              styles.progressThumb,
              {
                left: `${currentProgress * 100}%`,
                backgroundColor: theme['c-primary'],
                transform: [{ scale: scaleAnim }],
                shadowColor: theme['c-primary'],
              },
            ]}
          />
        </View>
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingVertical: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  progressContainer: {
    paddingVertical: 8,
  },
  progressTrack: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  progressBuffered: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
})
