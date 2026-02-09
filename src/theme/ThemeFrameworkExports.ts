/**
 * 主题框架系统导出
 * 统一导出所有主题框架相关的组件和工具
 */

// 核心配置
export {
  ThemeFrameworkType,
  MaterialStyles,
  CupertinoStyles,
  THEME_FRAMEWORKS,
  getRecommendedFramework,
  getFrameworkStyles,
} from './ThemeFramework'

// 主题化组件
export { ThemedButton } from '@/components/common/ThemedButton'
export { ThemedCard } from '@/components/common/ThemedCard'
export { ThemedListItem } from '@/components/common/ThemedListItem'

// 设置组件
export { ThemeFrameworkSetting } from '@/components/settings/ThemeFrameworkSetting'

// 工具函数
export {
  initializeThemeFramework,
  getCurrentFramework,
  isMaterialFramework,
  isCupertinoFramework,
} from '@/utils/themeFrameworkInit'

// 类型定义
export type { ThemeFrameworkConfig } from './ThemeFramework'
