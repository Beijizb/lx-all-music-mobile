/**
 * 主题框架初始化工具
 * 在应用启动时加载用户保存的主题框架设置
 */

import settingState from '@/store/setting/state'
import themeAction from '@/store/theme/action'
import { ThemeFrameworkType, getRecommendedFramework } from '@/theme/ThemeFramework'

/**
 * 初始化主题框架
 * 从设置中读取用户选择的框架，如果没有则使用平台推荐
 */
export async function initializeThemeFramework(): Promise<void> {
  try {
    const savedFramework = settingState.setting['theme.framework'] as ThemeFrameworkType | null

    if (savedFramework && Object.values(ThemeFrameworkType).includes(savedFramework)) {
      // 使用用户保存的框架
      themeAction.setFramework(savedFramework)
      console.log(`[ThemeFramework] 已加载用户设置的框架: ${savedFramework}`)
    } else {
      // 使用平台推荐的框架
      const recommended = getRecommendedFramework()
      themeAction.setFramework(recommended)
      console.log(`[ThemeFramework] 使用平台推荐框架: ${recommended}`)
    }
  } catch (error) {
    console.error('[ThemeFramework] 初始化失败:', error)
    // 出错时使用平台推荐
    const recommended = getRecommendedFramework()
    themeAction.setFramework(recommended)
  }
}

/**
 * 获取当前主题框架
 */
export function getCurrentFramework(): ThemeFrameworkType {
  return themeAction.getFramework()
}

/**
 * 判断当前是否使用 Material Design
 */
export function isMaterialFramework(): boolean {
  return getCurrentFramework() === ThemeFrameworkType.MATERIAL
}

/**
 * 判断当前是否使用 Cupertino (iOS) 风格
 */
export function isCupertinoFramework(): boolean {
  return getCurrentFramework() === ThemeFrameworkType.CUPERTINO
}
