import { memo } from 'react'

import Theme from '../Theme'
import Section from '../../components/Section'
import Source from './Source'
import SourceName from './SourceName'
import Language from './Language'
import FontSize from './FontSize'
import ShareType from './ShareType'
import IsStartupAutoPlay from './IsStartupAutoPlay'
import IsStartupPushPlayDetailScreen from './IsStartupPushPlayDetailScreen'
import IsAutoHidePlayBar from './IsAutoHidePlayBar'
import IsHomePageScroll from './IsHomePageScroll'
import IsUseSystemFileSelector from './IsUseSystemFileSelector'
import IsAlwaysKeepStatusbarHeight from './IsAlwaysKeepStatusbarHeight'
import DrawerLayoutPosition from './DrawerLayoutPosition'
import ThemeFramework from './ThemeFramework'
import { useI18n } from '@/lang/i18n'
import WyCookie from './WyCookie'
import BiCookie from './BiCookie'
import NavMenu from "@/screens/Home/Views/Setting/settings/Basic/NavMenu";

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_basic')}>
      {/*<IsStartupAutoPlay />*/}
      {/*<IsStartupPushPlayDetailScreen />*/}
      {/*<IsShowBackBtn />*/}
      {/*<IsShowExitBtn />*/}
      <IsAutoHidePlayBar />
      <IsHomePageScroll />
      <IsUseSystemFileSelector />
      <IsAlwaysKeepStatusbarHeight />
      <Theme />
      <ThemeFramework />
      <DrawerLayoutPosition />
      <NavMenu />
      <Language />
      <FontSize />
      <ShareType />
      <Source />
      <SourceName />
      <WyCookie />
      <BiCookie />
    </Section>
  )
})
