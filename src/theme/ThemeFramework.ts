/**
 * 主题框架系统
 * 支持 Material Design 和 iOS Cupertino 两种设计风格
 */

import { Platform } from 'react-native'

/**
 * 主题框架类型
 */
export enum ThemeFrameworkType {
  /** Material Design 3 - Android 风格 */
  MATERIAL = 'material',
  /** Cupertino - iOS 风格 */
  CUPERTINO = 'cupertino',
}

/**
 * 主题框架配置
 */
export interface ThemeFrameworkConfig {
  /** 框架类型 */
  type: ThemeFrameworkType
  /** 框架名称 */
  name: string
  /** 框架描述 */
  description: string
  /** 推荐平台 */
  recommendedPlatform: 'ios' | 'android' | 'all'
}

/**
 * Material Design 样式配置
 */
export const MaterialStyles = {
  // 圆角
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    extraLarge: 16,
  },
  // 阴影
  elevation: {
    level0: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    level1: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    level2: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.20,
      shadowRadius: 1.41,
      elevation: 2,
    },
    level3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
  },
  // 字体
  typography: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    fontWeights: {
      regular: '400' as const,
      medium: '500' as const,
      bold: '700' as const,
    },
  },
  // 按钮
  button: {
    height: 40,
    minWidth: 64,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  // 列表项
  listItem: {
    height: 56,
    paddingHorizontal: 16,
  },
}

/**
 * iOS Cupertino 样式配置
 */
export const CupertinoStyles = {
  // 圆角
  borderRadius: {
    small: 8,
    medium: 10,
    large: 12,
    extraLarge: 14,
  },
  // 阴影（iOS 风格更轻）
  elevation: {
    level0: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    level1: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0.5 },
      shadowOpacity: 0.1,
      shadowRadius: 0.5,
      elevation: 1,
    },
    level2: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 1,
      elevation: 2,
    },
    level3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.14,
      shadowRadius: 2,
      elevation: 3,
    },
  },
  // 字体
  typography: {
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'System',
      default: 'System',
    }),
    fontWeights: {
      regular: '400' as const,
      medium: '600' as const,
      bold: '700' as const,
    },
  },
  // 按钮
  button: {
    height: 44,
    minWidth: 60,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  // 列表项
  listItem: {
    height: 44,
    paddingHorizontal: 16,
  },
  // iOS 蓝色
  systemBlue: '#007AFF',
}

/**
 * 可用的主题框架列表
 */
export const THEME_FRAMEWORKS: ThemeFrameworkConfig[] = [
  {
    type: ThemeFrameworkType.MATERIAL,
    name: 'Material Design',
    description: 'Google Material Design 3 设计风格',
    recommendedPlatform: 'android',
  },
  {
    type: ThemeFrameworkType.CUPERTINO,
    name: 'iOS 风格',
    description: 'Apple iOS Cupertino 设计风格',
    recommendedPlatform: 'ios',
  },
]

/**
 * 获取推荐的主题框架（根据平台）
 */
export function getRecommendedFramework(): ThemeFrameworkType {
  return Platform.OS === 'ios'
    ? ThemeFrameworkType.CUPERTINO
    : ThemeFrameworkType.MATERIAL
}

/**
 * 获取当前框架的样式配置
 */
export function getFrameworkStyles(framework: ThemeFrameworkType) {
  return framework === ThemeFrameworkType.CUPERTINO
    ? CupertinoStyles
    : MaterialStyles
}
