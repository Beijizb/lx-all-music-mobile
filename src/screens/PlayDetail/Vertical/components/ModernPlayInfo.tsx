/**
 * ModernPlayInfo - 现代化歌曲信息组件
 *
 * 新特性：
 * - 更清晰的信息层级
 * - 更大的字体
 * - 优化的间距
 * - 支持长标题滚动
 */

import { memo } from 'react'
import { View } from 'react-native'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'

export default memo(() => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()

  return (
    <View style={styles.container} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_playInfo}>
      {/* 歌曲标题 */}
      <Text
        size={24}
        color={theme['c-font']}
        numberOfLines={2}
        style={styles.title}
      >
        {musicInfo.name || '未知歌曲'}
      </Text>

      {/* 歌手和专辑 */}
      <View style={styles.subtitleRow}>
        <Text
          size={16}
          color={theme['c-font-label']}
          numberOfLines={1}
          style={styles.subtitle}
        >
          {musicInfo.singer || '未知歌手'}
        </Text>
        {musicInfo.albumName && (
          <>
            <Text size={16} color={theme['c-font-label']} style={styles.separator}>
              {' · '}
            </Text>
            <Text
              size={16}
              color={theme['c-font-label']}
              numberOfLines={1}
              style={styles.subtitle}
            >
              {musicInfo.albumName}
            </Text>
          </>
        )}
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  subtitle: {
    flexShrink: 1,
  },
  separator: {
    marginHorizontal: 4,
  },
})
