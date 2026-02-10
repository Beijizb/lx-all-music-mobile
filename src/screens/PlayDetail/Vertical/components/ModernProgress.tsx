/**
 * ModernProgress - Apple Music 风格进度条
 *
 * 新特性：
 * - 微弱的默认轨道（透明度12%）
 * - 交互时轨道变亮（45% → 80%）
 * - 滑块从隐藏到显示
 * - 更细的进度条（3px）
 * - 流畅的动画过渡（200ms）
 */

import { memo, useRef, useState, useCallback } from 'react'
import { View, Animated, PanResponder } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { usePlayerProgress, usePlayerBufferedProgress } from '@/store/player/hook'
import { seek } from '@/plugins/player'
import { formatPlayTime } from '@/utils'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const theme = useTheme()
  const progress = usePlayerProgress()
  const bufferedProgress = usePlayerBufferedProgress()

  const [isDragging, setIsDragging] = useState(false)
  const [tempProgress, setTempProgress] = useState(0)

  // 动画值
  const trackOpacityAnim = useRef(new Animated.Value(0.12)).current
  const thumbOpacityAnim = useRef(new Animated.Value(0)).current
  const containerWidth = useRef(0)

  // 拖动手势
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        setIsDragging(true)
        // 交互时：轨道变亮，滑块显示
        Animated.parallel([
          Animated.timing(trackOpacityAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(thumbOpacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start()
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
        // 恢复默认状态
        Animated.parallel([
          Animated.timing(trackOpacityAnim, {
            toValue: 0.12,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(thumbOpacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start()

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

  // Apple Music 风格：更细的进度条
  const progressHeight = 3

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
        {/* 背景轨道 - 动态透明度 */}
        <Animated.View
          style={[
            styles.progressTrack,
            {
              height: progressHeight,
              borderRadius: progressHeight / 2,
              backgroundColor: theme['c-font-label'],
              opacity: trackOpacityAnim,
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
                backgroundColor: theme['c-primary-light-200'],
                opacity: 0.5,
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

          {/* 滑块 - 动态显示 */}
          <Animated.View
            style={[
              styles.progressThumb,
              {
                left: `${currentProgress * 100}%`,
                backgroundColor: '#FFFFFF',
                opacity: thumbOpacityAnim,
                shadowColor: '#000',
              },
            ]}
          />
        </Animated.View>
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
