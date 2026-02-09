# 现代化 UI 集成指南

## 📋 集成步骤

### 阶段 1：播放器详情页集成

#### 步骤 1.1：替换封面组件

**文件**: `src/screens/PlayDetail/Vertical/index.tsx`

```typescript
// 原来的导入
import Pic from './Pic'

// 替换为
import ModernCover from './components/ModernCover'

// 在 JSX 中替换
<ModernCover componentId={componentId} />
```

#### 步骤 1.2：替换播放器组件

```typescript
// 原来的导入
import Player from './Player'

// 替换为
import ModernPlayer from './components/ModernPlayer'

// 在 JSX 中替换
<ModernPlayer componentId={componentId} />
```

#### 步骤 1.3：完整替换（可选）

如果想使用完整的新版本：

```typescript
// 在 src/screens/PlayDetail/index.tsx 中
import ModernPlayDetail from './Vertical/ModernPlayDetail'

// 替换整个组件
export default ModernPlayDetail
```

---

### 阶段 2：音乐列表集成

#### 步骤 2.1：创建列表项适配器

**文件**: `src/screens/Home/Views/Mylist/MusicList/ModernListItem.tsx`

```typescript
import React, { memo } from 'react'
import { ModernListItem } from '@/components/modern'
import { formatPlayTime } from '@/utils'

interface Props {
  musicInfo: LX.Music.MusicInfo
  index?: number
  showIndex?: boolean
  onPress: () => void
  onLongPress?: () => void
  onMorePress?: () => void
}

export default memo(function MusicListItem({
  musicInfo,
  index,
  showIndex = false,
  onPress,
  onLongPress,
  onMorePress,
}: Props) {
  // 获取音质类型
  const getBadgeType = () => {
    if (musicInfo._qualitys?.flac24bit) return 'vip'
    if (musicInfo._qualitys?.flac) return 'sq'
    if (musicInfo._qualitys?.['320k']) return 'hq'
    return 'normal'
  }

  return (
    <ModernListItem
      title={musicInfo.name}
      subtitle={`${musicInfo.singer} · ${musicInfo.albumName || '未知专辑'}`}
      coverUri={musicInfo.img}
      coverSize={70}
      showBadge={true}
      badgeType={getBadgeType()}
      showIndex={showIndex}
      index={index}
      showDuration={true}
      duration={formatPlayTime(musicInfo.interval)}
      onPress={onPress}
      onLongPress={onLongPress}
      onMorePress={onMorePress}
    />
  )
})
```

#### 步骤 2.2：在列表中使用

**文件**: `src/screens/Home/Views/Mylist/MusicList/List.tsx`

```typescript
import ModernMusicListItem from './ModernListItem'

// 在 renderItem 中
const renderItem = ({ item, index }: { item: LX.Music.MusicInfo; index: number }) => {
  return (
    <ModernMusicListItem
      musicInfo={item}
      index={index + 1}
      showIndex={settingState.setting['list.isShowIndex']}
      onPress={() => handlePlay(item, index)}
      onLongPress={() => handleLongPress(item, index)}
      onMorePress={() => handleMore(item, index)}
    />
  )
}
```

---

### 阶段 3：性能优化

#### 优化 3.1：列表虚拟化

确保使用 `FlatList` 并配置正确的优化参数：

```typescript
<FlatList
  data={musicList}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  // 性能优化
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={15}
  windowSize={21}
  // 使用 memo 的 renderItem
  getItemLayout={(data, index) => ({
    length: 80, // ModernListItem 的高度
    offset: 80 * index,
    index,
  })}
/>
```

#### 优化 3.2：图片缓存

如果还没有使用 `react-native-fast-image`，建议添加：

```bash
npm install react-native-fast-image
```

然后在 `ModernListItem` 中使用：

```typescript
import FastImage from 'react-native-fast-image'

// 替换 Image 组件
<FastImage
  source={{ uri: coverUri, priority: FastImage.priority.normal }}
  style={styles.cover}
  resizeMode={FastImage.resizeMode.cover}
/>
```

#### 优化 3.3：组件 Memo

确保所有组件都使用 `memo`：

```typescript
export default memo(function ComponentName(props) {
  // ...
}, (prevProps, nextProps) => {
  // 自定义比较逻辑（可选）
  return prevProps.id === nextProps.id
})
```

---

### 阶段 4：主题切换优化

#### 优化 4.1：添加过渡动画

**文件**: `src/store/theme/action.ts`

```typescript
import { Animated } from 'react-native'

const themeTransition = new Animated.Value(0)

export const setFramework = (framework: ThemeFrameworkType) => {
  // 淡出
  Animated.timing(themeTransition, {
    toValue: 0,
    duration: 150,
    useNativeDriver: true,
  }).start(() => {
    // 更新主题
    themeState.framework = framework
    global.state_event.themeUpdated()

    // 淡入
    Animated.timing(themeTransition, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()
  })
}
```

---

### 阶段 5：测试清单

#### 功能测试
- [ ] 播放器封面旋转正常
- [ ] 播放器控制按钮响应正常
- [ ] 进度条拖动正常
- [ ] 列表项点击、长按正常
- [ ] 主题切换正常
- [ ] 动画流畅无卡顿

#### 性能测试
- [ ] 列表滚动流畅（60fps）
- [ ] 图片加载不卡顿
- [ ] 内存占用正常
- [ ] 主题切换不卡顿

#### 兼容性测试
- [ ] Android 测试通过
- [ ] iOS 测试通过（如果支持）
- [ ] 不同屏幕尺寸正常
- [ ] 横屏/竖屏切换正常

---

## 🔧 常见问题

### 问题 1：组件导入错误

**错误**：`Cannot find module '@/components/modern'`

**解决**：检查 `tsconfig.json` 中的路径配置：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 问题 2：动画卡顿

**原因**：使用了非原生驱动的动画

**解决**：确保所有动画都使用 `useNativeDriver: true`：

```typescript
Animated.spring(scaleAnim, {
  toValue: 0.95,
  useNativeDriver: true, // 必须设置
  tension: 300,
  friction: 20,
}).start()
```

### 问题 3：列表性能差

**原因**：没有正确配置虚拟化

**解决**：
1. 使用 `FlatList` 而不是 `ScrollView`
2. 提供 `getItemLayout`
3. 使用 `memo` 包装列表项
4. 避免在 `renderItem` 中创建新函数

### 问题 4：图片加载慢

**原因**：没有使用图片缓存

**解决**：
1. 使用 `react-native-fast-image`
2. 配置图片缓存策略
3. 使用合适的图片尺寸

---

## 📊 性能基准

### 目标性能指标

| 指标 | 目标值 | 测量方法 |
|------|--------|---------|
| 列表滚动 FPS | ≥ 55 | React DevTools Profiler |
| 主题切换时间 | ≤ 300ms | 手动计时 |
| 内存占用 | ≤ 150MB | Android Studio Profiler |
| 应用启动时间 | ≤ 3s | 手动计时 |

### 性能优化检查清单

- [ ] 所有列表使用 `FlatList`
- [ ] 所有组件使用 `memo`
- [ ] 所有动画使用 `useNativeDriver`
- [ ] 图片使用缓存
- [ ] 避免不必要的重渲染
- [ ] 使用 `useMemo` 和 `useCallback`

---

## 🚀 渐进式集成策略

### 策略 1：逐步替换（推荐）

**优点**：风险低，可以逐步测试

**步骤**：
1. 先替换播放器详情页（影响最小）
2. 再替换音乐列表（核心功能）
3. 最后替换首页（影响最大）

### 策略 2：功能开关

添加设置项控制是否使用新 UI：

```typescript
// 在 defaultSetting.ts 中
'ui.useModernComponents': false

// 在组件中
const useModern = useSettingValue('ui.useModernComponents')

return useModern ? <ModernComponent /> : <OldComponent />
```

### 策略 3：A/B 测试

随机分配用户使用新旧 UI，收集反馈。

---

## 📝 回滚计划

如果集成后出现严重问题，可以快速回滚：

### 回滚步骤

1. **恢复导入**：
   ```typescript
   // 改回原来的导入
   import Pic from './Pic'
   import Player from './Player'
   ```

2. **恢复 JSX**：
   ```typescript
   // 使用原来的组件
   <Pic componentId={componentId} />
   <Player componentId={componentId} />
   ```

3. **Git 回滚**：
   ```bash
   git revert HEAD
   git push
   ```

---

## 📚 相关文档

- `UI_REDESIGN_PLAN.md` - 设计方案
- `ModernComponentsDemo.tsx` - 组件演示
- `ModernHomeDemo.tsx` - 首页演示

---

**版本**: 1.0.0
**创建时间**: 2026-02-09
**状态**: 集成中
