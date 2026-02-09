import { buildActiveThemeColors } from '@/theme/themes'
import { ThemeFrameworkType } from '@/theme/ThemeFramework'
import state from './state'

export default {
  setTheme(theme: LX.Theme) {
    state.theme = buildActiveThemeColors(theme)
    // ThemeContext.displayName
    global.state_event.themeUpdated(state.theme)
  },
  setShouldUseDarkColors(shouldUseDarkColors: boolean) {
    if (state.shouldUseDarkColors == shouldUseDarkColors) return
    state.shouldUseDarkColors = shouldUseDarkColors
  },
  /**
   * 设置主题框架
   */
  setFramework(framework: ThemeFrameworkType) {
    if (state.framework === framework) return
    state.framework = framework
    // 触发主题更新事件
    global.state_event.themeUpdated(state.theme)
  },
  /**
   * 获取当前主题框架
   */
  getFramework(): ThemeFrameworkType {
    return state.framework
  },
}
