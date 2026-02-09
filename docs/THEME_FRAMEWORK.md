# 主题框架系统使用指南

## 概述

本项目实现了 Material Design 和 iOS Cupertino 两种设计风格的主题框架系统，用户可以手动切换。

## 功能特性

- ✅ **Material Design 3** - Google Android 设计风格
- ✅ **iOS Cupertino** - Apple iOS 设计风格
- ✅ 手动切换框架
- ✅ 自动保存用户选择
- ✅ 平台推荐（Android 推荐 Material，iOS 推荐 Cupertino）
- ✅ 主题化组件（按钮、卡片、列表项）

## 文件结构

```
src/
├── theme/
│   └── ThemeFramework.ts          # 主题框架核心配置
├── store/
│   └── theme/
│       ├── state.ts                # 添加了 framework 状态
│       └── action.ts               # 添加了框架切换方法
├── components/
│   ├── common/
│   │   ├── ThemedButton.tsx        # 主题化按钮
│   │   ├── ThemedCard.tsx          # 主题化卡片
│   │   └── ThemedListItem.tsx      # 主题化列表项
│   └── settings/
│       └── ThemeFrameworkSetting.tsx  # 框架设置页面
├── utils/
│   └── themeFrameworkInit.ts       # 初始化工具
└── config/
    └── defaultSetting.ts           # 添加了 theme.framework 配置
```

## 快速开始

### 1. 在应用启动时初始化

在 `src/app.ts` 或主入口文件中添加：

```typescript
import { initializeThemeFramework } from '@/utils/themeFrameworkInit'

// 在应用初始化时调用
async function initApp() {
  // ... 其他初始化代码

  // 初始化主题框架
  await initializeThemeFramework()

  // ... 其他初始化代码
}
```

### 2. 在设置页面中使用

```typescript
import { ThemeFrameworkSetting } from '@/components/settings/ThemeFrameworkSetting'

// 在设置页面中渲染
<ThemeFrameworkSetting />
```

### 3. 使用主题化组件

#### 按钮

```typescript
import { ThemedButton } from '@/components/common/ThemedButton'

<ThemedButton
  title="确定"
  onPress={() => console.log('点击')}
  variant="filled"  // 'filled' | 'outlined' | 'text'
/>
```

#### 卡片

```typescript
import { ThemedCard } from '@/components/common/ThemedCard'

<ThemedCard elevated={true}>
  <Text>卡片内容</Text>
</ThemedCard>
```

#### 列表项

```typescript
import { ThemedListItem } from '@/components/common/ThemedListItem'

<ThemedListItem
  title="设置项"
  subtitle="描述信息"
  leftIcon={<Icon name="settings" />}
  onPress={() => console.log('点击')}
/>
```

## 样式差异

### Material Design
- 圆角：4-16px
- 阴影：较明显
- 按钮高度：40px
- 列表项高度：56px
- 字体：Roboto (Android) / System (iOS)

### iOS Cupertino
- 圆角：8-14px
- 阴影：较轻
- 按钮高度：44px
- 列表项高度：44px
- 字体：SF Pro Display (iOS) / System (Android)

## API 参考

### ThemeFrameworkType

```typescript
enum ThemeFrameworkType {
  MATERIAL = 'material',
  CUPERTINO = 'cupertino',
}
```

### 主题框架方法

```typescript
import themeAction from '@/store/theme/action'

// 设置框架
themeAction.setFramework(ThemeFrameworkType.MATERIAL)

// 获取当前框架
const framework = themeAction.getFramework()
```

### 工具函数

```typescript
import {
  getCurrentFramework,
  isMaterialFramework,
  isCupertinoFramework,
} from '@/utils/themeFrameworkInit'

// 获取当前框架
const framework = getCurrentFramework()

// 判断是否为 Material
if (isMaterialFramework()) {
  // Material 特定逻辑
}

// 判断是否为 Cupertino
if (isCupertinoFramework()) {
  // Cupertino 特定逻辑
}
```

## 自定义组件

如果需要创建自己的主题化组件，可以参考以下模式：

```typescript
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { getFrameworkStyles } from '@/theme/ThemeFramework'
import themeState from '@/store/theme/state'

export const MyThemedComponent: React.FC = () => {
  const theme = useTheme()
  const framework = themeState.framework
  const frameworkStyles = getFrameworkStyles(framework)

  return (
    <View
      style={{
        borderRadius: frameworkStyles.borderRadius.medium,
        backgroundColor: theme['c-content-background'],
        ...frameworkStyles.elevation.level2,
      }}
    >
      {/* 组件内容 */}
    </View>
  )
}
```

## 注意事项

1. **性能优化**：框架切换会触发全局主题更新，建议在设置页面进行切换
2. **持久化**：框架选择会自动保存到 `theme.framework` 设置项
3. **兼容性**：所有主题化组件都兼容现有的主题系统
4. **扩展性**：可以轻松添加新的框架类型（如 Windows Fluent Design）

## 常见问题

### Q: 如何添加新的主题框架？

A: 在 `ThemeFramework.ts` 中：
1. 添加新的枚举值到 `ThemeFrameworkType`
2. 创建新的样式配置对象
3. 更新 `THEME_FRAMEWORKS` 数组
4. 在 `getFrameworkStyles` 中添加对应逻辑

### Q: 如何让某个组件强制使用特定框架？

A: 可以直接导入样式配置：

```typescript
import { MaterialStyles, CupertinoStyles } from '@/theme/ThemeFramework'

// 强制使用 Material 样式
const style = {
  borderRadius: MaterialStyles.borderRadius.medium,
}
```

### Q: 框架切换后需要重启应用吗？

A: 不需要，框架切换是实时生效的。

## 更新日志

### v1.0.0 (2026-02-09)
- ✨ 初始版本
- ✅ 支持 Material Design 和 iOS Cupertino
- ✅ 提供主题化组件（按钮、卡片、列表项）
- ✅ 设置页面集成
- ✅ 自动保存用户选择
