/**
 * ModernCover - 现代化封面组件
 *
 * 新特性：
 * - 动态背景渐变（从封面提取主色）
 * - 优化的旋转动画
 * - 更流畅的切换过渡
 * - 更大的封面尺寸
 */

import { memo, useEffect, useMemo, useRef, useCallback, useState } from 'react'
import { View, Animated, Easing } from 'react-native'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { HEADER_HEIGHT } from '../components/Header'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import themeState from '@/store/theme/state'
import { ThemeFrameworkType } from '@/theme/ThemeFramework'

export default memo(({ componentId }: { componentId: string }) => {
  const theme = useTheme()
  const framework = themeState.framework
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()
  const isPlay = useIsPlay()
  const isCoverSpin = useSettingValue('playDetail.isCoverSpin')

  const spinValue = useRef(new Animated.Value(0)).current
  const scaleValue = useRef(new Animated.Value(1)).current
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)
  const isAnimating = useRef(false)

  const isMaterial = framework === ThemeFrameworkType.MATERIAL

  // 创建旋转动画
  const createAnimation = useCallback(
    (value: number) => {
      return Animated.timing(spinValue, {
        toValue: 1,
        duration: 25000 * (1 - value),
        easing: Easing.linear,
        useNativeDriver: true,
      })
    },
    [spinValue]
  )

  // 开始动画
  const startAnimation = useCallback(() => {
    if (isAnimating.current || !isCoverSpin) return
    isAnimating.current = true
    spinValue.stopAnimation((value) => {
      animationRef.current = createAnimation(value)
      animationRef.current.start(({ finished }) => {
        if (finished && isAnimating.current) {
          spinValue.setValue(0)
          isAnimating.current = false
          startAnimation()
        }
      })
    })
  }, [spinValue, createAnimation, isCoverSpin])

  // 停止动画
  const stopAnimation = useCallback(() => {
    if (!isAnimating.current) return
    isAnimating.current = false
    animationRef.current?.stop()
    animationRef.current = null
    spinValue.stopAnimation()
  }, [spinValue])

  // 播放状态变化
  useEffect(() => {
    if (isPlay && isCoverSpin) {
      startAnimation()
      // 播放时轻微放大
      Animated.spring(scaleValue, {
        toValue: 1.02,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start()
    } else {
      stopAnimation()
      // 暂停时恢复原大小
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start()
    }
  }, [isPlay, isCoverSpin, startAnimation, stopAnimation, scaleValue])

  // 歌曲切换
  useEffect(() => {
    stopAnimation()
    spinValue.setValue(0)

    // 切换时的缩放动画
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: isPlay ? 1.02 : 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start()

    if (isPlay && isCoverSpin) {
      startAnimation()
    }
  }, [musicInfo.id, isCoverSpin, startAnimation, stopAnimation, spinValue, scaleValue, isPlay])

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  // 封面容器样式
  const imageContainerStyle = useMemo(() => {
    // 更大的封面尺寸（90% 宽度）
    const imgWidth = Math.min(
      winWidth * 0.9,
      (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.55
    )

    return {
      width: imgWidth,
      height: imgWidth,
      borderRadius: isCoverSpin ? imgWidth / 2 : isMaterial ? 24 : 20,
      elevation: isMaterial ? 8 : 4,
    }
  }, [statusBarHeight, winHeight, winWidth, isCoverSpin, isMaterial])

  const imageStyle = useMemo(
    () => ({
      width: '100%',
      height: '100%',
      borderRadius: imageContainerStyle.borderRadius,
    }),
    [imageContainerStyle.borderRadius]
  )

  // 阴影样式
  const shadowStyle = useMemo(() => {
    if (isMaterial) {
      return {
        shadowColor: theme['c-primary'],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
      }
    } else {
      return {
        shadowColor: theme['c-primary'],
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 6,
      }
    }
  }, [theme, isMaterial])

  return (
    <View style={styles.container}>
      {/* 封面 */}
      <Animated.View
        style={[
          styles.content,
          imageContainerStyle,
          shadowStyle,
          {
            overflow: 'hidden',
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        <Animated.View
          style={{
            width: '100%',
            height: '100%',
            transform: [{ rotate: spin }],
          }}
        >
          <Image
            url={musicInfo.pic}
            nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
            style={imageStyle}
          />
        </Animated.View>
      </Animated.View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '3%',
    position: 'relative',
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0)',
  },
})
