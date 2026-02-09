# 主题框架使用指南

## 如何开启新主题框架

### 方法 1：在应用设置中切换（推荐）

1. **打开应用**
2. **进入设置** → 点击底部导航栏的"设置"图标
3. **找到"基本设置"** → 在设置列表中选择"基本设置"
4. **主题框架选项** → 在"主题"下方可以看到"主题框架"设置
5. **选择框架**：
   - **Material Design** - Google Android 风格（圆角较小，阴影明显）
   - **iOS 风格** - Apple Cupertino 风格（圆角较大，阴影较轻）
6. **立即生效** - 选择后会立即应用新的设计风格

### 方法 2：使用主题化组件（开发者）

如果你是开发者，可以使用新的主题化组件：

```typescript
import { ThemedButton, ThemedCard, ThemedListItem } from '@/theme/ThemeFrameworkExports'

// 使用主题化按钮
<ThemedButton
  title="确定"
  onPress={handlePress}
  variant="filled"  // 'filled' | 'outlined' | 'text'
/>

// 使用主题化卡片
<ThemedCard elevated={true}>
  <Text>卡片内容</Text>
</ThemedCard>

// 使用主题化列表项
<ThemedListItem
  title="设置项"
  subtitle="描述"
  onPress={handlePress}
/>
```

## 两种框架的区别

### Material Design（Android 风格）
- ✅ 圆角：4-16px（较小）
- ✅ 阴影：较明显，有层次感
- ✅ 按钮高度：40px
- ✅ 列表项高度：56px
- ✅ 字体：Roboto（Android）/ System（iOS）
- ✅ 适合：Android 用户

### iOS Cupertino（iOS 风格）
- ✅ 圆角：8-14px（较大）
- ✅ 阴影：较轻，更扁平
- ✅ 按钮高度：44px
- ✅ 列表项高度：44px
- ✅ 字体：SF Pro Display（iOS）/ System（Android）
- ✅ 适合：iPhone 用户

## 推荐设置

- **Android 手机** → 选择 Material Design
- **iPhone** → 选择 iOS 风格
- **平板** → 根据个人喜好选择

## 常见问题

### Q: 切换框架后需要重启应用吗？
A: 不需要，切换后立即生效。

### Q: 切换框架会影响主题颜色吗？
A: 不会，只影响组件的形状、圆角、阴影等设计风格，主题颜色保持不变。

### Q: 可以自定义框架样式吗？
A: 目前提供两种预设框架，未来可能会添加更多自定义选项。

### Q: 哪些组件支持主题框架？
A: 目前支持：
- 按钮（ThemedButton）
- 卡片（ThemedCard）
- 列表项（ThemedListItem）
- 更多组件正在开发中...

## 技术细节

### 自动初始化
应用启动时会自动加载你上次选择的框架，无需手动设置。

### 平台推荐
- Android 设备默认推荐 Material Design
- iOS 设备默认推荐 Cupertino 风格
- 你可以随时更改为其他框架

### 持久化存储
框架选择会保存到本地设置（`theme.framework`），下次启动时自动恢复。

## 更新日志

### v2.0.1 (2026-02-09)
- ✨ 新增主题框架系统
- ✅ 支持 Material Design 和 iOS Cupertino
- ✅ 提供主题化组件库
- ✅ 集成到设置页面
- ✅ 自动保存用户选择

## 反馈与建议

如果你有任何问题或建议，欢迎在 GitHub 提 Issue：
https://github.com/Beijizb/lx-b/issues
