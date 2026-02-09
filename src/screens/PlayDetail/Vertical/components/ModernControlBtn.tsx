/**
 * ModernControlBtn - 现代化控制按钮组件
 *
 * 新特性：
 * - 更大的按钮（60px）
 * - 播放按钮突出显示（80px）
 * - 更好的按压反馈
 * - 优化的布局
 */

import { memo, useRef } from 'react'
import { View, Pressable, Animated } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import themeState from '@/store/theme/state'
import { ThemeFrameworkType } from '@/theme/ThemeFramework'
import Icon from '@/components/common/Icon'
import { useIsPlay, usePlayMode } from '@/store/player/hook'
import { playNext, playPrev, togglePlay, togglePlayMode } from '@/plugins/player'
import { createStyle } from '@/utils/tools'

// 播放模式图标映射
const PLAY_MODE_ICONS = {
  listLoop: 'repeat',
  random: 'shuffle',
  list: 'repeat-one-off',
  singleLoop: 'repeat-one',
  none: 'repeat-off',
} as const

export default memo(() => {
  const theme = useTheme()
  const framework = themeState.framework
  const isPlay = useIsPlay()
  const playMode = usePlayMode()

  const isMaterial = framework === ThemeFrameworkType.MATERIAL

  // 按钮动画
  const createButtonAnimation = () => {
    const scaleAnim = useRef(new Animated.Value(1)).current

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start()
    }

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start()
    }

    return { scaleAnim, handlePressIn, handlePressOut }
  }

  // 控制按钮组件
  const ControlButton = ({
    icon,
    size = 60,
    iconSize = 28,
    onPress,
    primary = false,
  }: {
    icon: string
    size?: number
    iconSize?: number
    onPress: () => void
    primary?: boolean
  }) => {
    const { scaleAnim, handlePressIn, handlePressOut } = createButtonAnimation()

    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={
          isMaterial
            ? {
                color: theme['c-primary-light-200-alpha-700'],
                borderless: true,
                radius: size / 2,
              }
            : undefined
        }
      >
        <Animated.View
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: primary
                ? theme['c-primary']
                : theme['c-primary-light-400-alpha-700'],
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Icon
            name={icon}
            size={iconSize}
            color={primary ? '#FFFFFF' : theme['c-primary']}
          />
        </Animated.View>
      </Pressable>
    )
  }

  return (
    <View style={styles.container}>
      {/* 播放模式 */}
      <ControlButton
        icon={PLAY_MODE_ICONS[playMode]}
        size={50}
        iconSize={24}
        onPress={togglePlayMode}
      />

      {/* 上一首 */}
      <ControlButton
        icon="skip-previous"
        size={60}
        iconSize={32}
        onPress={playPrev}
      />

      {/* 播放/暂停 */}
      <ControlButton
        icon={isPlay ? 'pause' : 'play'}
        size={80}
        iconSize={40}
        onPress={togglePlay}
        primary
      />

      {/* 下一首 */}
      <ControlButton
        icon="skip-next"
        size={60}
        iconSize={32}
        onPress={playNext}
      />

      {/* 占位符（保持对称） */}
      <View style={{ width: 50 }} />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
})
