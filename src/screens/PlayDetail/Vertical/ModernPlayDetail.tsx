/**
 * ModernPlayDetail - 现代化播放器详情页（竖屏）
 *
 * 新特性：
 * - 动态背景（从封面提取主色）
 * - 优化的封面动画
 * - 现代化进度条
 * - 更大的控制按钮
 * - 优化的布局和间距
 */

import { memo, useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { View, AppState, Animated, Easing } from 'react-native'
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view'

import Header from '../components/Header'
import MiniLyric from '../../components/MiniLyric'
import ModernCover from './components/ModernCover'
import ModernPlayer from './components/ModernPlayer'
import Lyric from '../Lyric'

import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

const LyricPage = ({ activeIndex }: { activeIndex: number }) => {
  const initedRef = useRef(false)
  const lyric = useMemo(() => <Lyric />, [])

  switch (activeIndex) {
    case 1:
      if (!initedRef.current) initedRef.current = true
      return lyric
    default:
      return initedRef.current ? lyric : null
  }
}

export default memo(({ componentId }: { componentId: string }) => {
  const theme = useTheme()
  const [pageIndex, setPageIndex] = useState(0)
  const pagerViewRef = useRef<PagerView>(null)
  const showLyricRef = useRef(false)

  const onPageSelected = ({ nativeEvent }: PagerViewOnPageSelectedEvent) => {
    setPageIndex(nativeEvent.position)
    showLyricRef.current = nativeEvent.position == 1

    if (showLyricRef.current) {
      screenkeepAwake()
    } else {
      screenUnkeepAwake()
    }
  }

  const handleSwitchToLyricPage = useCallback(() => {
    pagerViewRef.current?.setPage(1)
  }, [])

  useEffect(() => {
    let appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          if (showLyricRef.current && !commonState.componentIds.comment) screenkeepAwake()
          break
        case 'background':
          screenUnkeepAwake()
          break
      }
    })

    const handleComponentIdsChange = (ids: CommonState['componentIds']) => {
      if (ids.comment) screenUnkeepAwake()
      else if (AppState.currentState == 'active') screenkeepAwake()
    }

    global.state_event.on('componentIdsUpdated', handleComponentIdsChange)

    return () => {
      global.state_event.off('componentIdsUpdated', handleComponentIdsChange)
      appstateListener.remove()
      screenUnkeepAwake()
    }
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: theme['c-app-background'] }]}>
      <Header />
      <View style={styles.content}>
        <PagerView
          onPageSelected={onPageSelected}
          style={styles.pagerView}
          ref={pagerViewRef}
        >
          {/* 封面页 */}
          <View collapsable={false}>
            <View collapsable={false} style={styles.picPageContainer}>
              <ModernCover componentId={componentId} />
              <MiniLyric
                onPress={handleSwitchToLyricPage}
                style={styles.miniLyricContainer}
              />
            </View>
          </View>

          {/* 歌词页 */}
          <View collapsable={false}>
            <LyricPage activeIndex={pageIndex} />
          </View>
        </PagerView>

        {/* 播放控制 */}
        <ModernPlayer componentId={componentId} />
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
  },
  pagerView: {
    flex: 1,
  },
  picPageContainer: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  miniLyricContainer: {
    position: 'absolute',
    bottom: '6%',
    left: '10%',
    right: '10%',
    alignItems: 'flex-start',
  },
})
