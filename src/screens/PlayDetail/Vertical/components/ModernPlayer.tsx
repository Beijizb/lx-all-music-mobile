/**
 * ModernPlayer - 现代化播放器控制组件
 *
 * 新特性：
 * - 现代化进度条（更粗、拖动放大）
 * - 更大的控制按钮
 * - 优化的布局和间距
 * - 更好的视觉层级
 */

import { memo } from 'react'
import { View } from 'react-native'

import ModernPlayInfo from './ModernPlayInfo'
import ModernProgress from './ModernProgress'
import ModernControlBtn from './ModernControlBtn'
import MoreBtn from '../../Player/components/MoreBtn'

import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'

export default memo(({ componentId }: { componentId: string }) => {
  return (
    <View style={styles.container} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
      {/* 歌曲信息 */}
      <ModernPlayInfo />

      {/* 进度条 */}
      <ModernProgress />

      {/* 控制按钮 */}
      <ModernControlBtn />

      {/* 更多按钮 */}
      <MoreBtn componentId={componentId} />
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 0,
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    flexDirection: 'column',
  },
})
