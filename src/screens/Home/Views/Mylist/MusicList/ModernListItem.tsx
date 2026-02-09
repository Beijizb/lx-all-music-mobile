/**
 * ModernListItem - 现代化音乐列表项适配器
 *
 * 将 ModernListItem 组件适配到现有的音乐列表中
 * 保持与现有接口的兼容性
 */

import { memo, useRef } from 'react'
import { TouchableOpacity } from 'react-native'
import { ModernListItem as BaseModernListItem } from '@/components/modern'
import { useTheme } from '@/store/theme/hook'
import { useAssertApiSupport } from '@/store/common/hook'
import { useI18n } from '@/lang'
import { formatPlayTime } from '@/utils/common'
import type { BadgeType } from '@/components/modern/ModernListItem'

const useQualityTag = (musicInfo: LX.Music.MusicInfoOnline): BadgeType => {
  if (musicInfo.meta._qualitys.hires) return 'vip'
  if (musicInfo.meta._qualitys.flac) return 'sq'
  if (musicInfo.meta._qualitys['320k']) return 'hq'
  return 'normal'
}

export default memo(
  ({
    item,
    index,
    activeIndex,
    onPress,
    onShowMenu,
    onLongPress,
    selectedList,
    isShowAlbumName,
    isShowInterval,
    showCover,
  }: {
    item: LX.Music.MusicInfo
    index: number
    activeIndex: number
    onPress: (item: LX.Music.MusicInfo, index: number) => void
    onLongPress: (item: LX.Music.MusicInfo, index: number) => void
    onShowMenu: (
      item: LX.Music.MusicInfo,
      index: number,
      position: { x: number; y: number; w: number; h: number }
    ) => void
    selectedList: LX.Music.MusicInfo[]
    isShowAlbumName: boolean
    isShowInterval: boolean
    showCover: boolean
  }) => {
    const theme = useTheme()
    const isSelected = selectedList.includes(item)
    const isSupported = useAssertApiSupport(item.source)
    const moreButtonRef = useRef<TouchableOpacity>(null)

    const badgeType = item.source === 'local' ? 'normal' : useQualityTag(item as LX.Music.MusicInfoOnline)
    const active = activeIndex === index

    const handleShowMenu = () => {
      if (moreButtonRef.current?.measure) {
        moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
          onShowMenu(item, index, {
            x: Math.ceil(px),
            y: Math.ceil(py),
            w: Math.ceil(width),
            h: Math.ceil(height),
          })
        })
      }
    }

    // 构建副标题
    const subtitle = isShowAlbumName && item.meta.albumName
      ? `${item.singer} · ${item.meta.albumName}`
      : item.singer

    return (
      <BaseModernListItem
        title={item.name}
        subtitle={subtitle}
        coverUri={showCover ? item.meta.picUrl : undefined}
        coverSize={showCover ? 52 : undefined}
        showBadge={true}
        badgeType={badgeType}
        showIndex={!showCover}
        index={showCover ? undefined : index + 1}
        showDuration={isShowInterval}
        duration={isShowInterval ? formatPlayTime(item.interval) : undefined}
        isActive={active}
        isSelected={isSelected}
        disabled={!isSupported}
        onPress={() => onPress(item, index)}
        onLongPress={() => onLongPress(item, index)}
        onMorePress={handleShowMenu}
        moreButtonRef={moreButtonRef}
      />
    )
  },
  (prevProps, nextProps) => {
    return !!(
      prevProps.item === nextProps.item &&
      prevProps.index === nextProps.index &&
      prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
      prevProps.isShowInterval === nextProps.isShowInterval &&
      prevProps.activeIndex !== nextProps.index &&
      nextProps.activeIndex !== nextProps.index &&
      nextProps.selectedList.includes(nextProps.item) ===
        prevProps.selectedList.includes(nextProps.item) &&
      prevProps.showCover === nextProps.showCover
    )
  }
)
