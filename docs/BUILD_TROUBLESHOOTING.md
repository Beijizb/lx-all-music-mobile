# GitHub Actions 构建失败排查指南

## 当前状态

构建失败于：`feat: 集成主题框架系统到应用设置 #54`

## 如何查看完整错误日志

1. **访问 GitHub Actions 页面**
   - 打开：https://github.com/Beijizb/lx-b/actions
   - 找到失败的构建（红色 ❌）

2. **查看详细日志**
   - 点击失败的构建
   - 点击 "Build Release APK" 任务
   - 展开失败的步骤
   - 查看完整的错误信息

3. **常见失败原因**

### 原因 1：构建超时
- **症状**：构建运行很长时间后失败
- **解决**：GitHub Actions 免费版有时间限制
- **操作**：重新运行构建（Re-run jobs）

### 原因 2：依赖下载失败
- **症状**：npm install 或 gradle 下载失败
- **解决**：网络问题，重试即可
- **操作**：Re-run jobs

### 原因 3：编译错误
- **症状**：TypeScript 或 Java 编译错误
- **解决**：检查代码语法
- **操作**：修复代码后重新推送

### 原因 4：签名问题
- **症状**：APK 签名失败
- **解决**：检查 keystore 配置
- **操作**：已在最近的提交中修复

### 原因 5：内存不足
- **症状**：Gradle daemon 崩溃
- **解决**：减少并行构建
- **操作**：修改 gradle.properties

## 快速修复步骤

### 步骤 1：重新运行构建

最简单的方法是重新运行构建：

1. 访问：https://github.com/Beijizb/lx-b/actions/runs/[RUN_ID]
2. 点击右上角 "Re-run jobs" → "Re-run failed jobs"
3. 等待构建完成

### 步骤 2：本地测试构建

在推送前本地测试：

```bash
cd D:/test/lx-b

# 清理
cd android
./gradlew clean

# 构建 release
./gradlew assembleRelease

# 检查生成的 APK
ls -lh app/build/outputs/apk/release/
```

### 步骤 3：检查代码

确保新增的代码没有语法错误：

```bash
# 检查 TypeScript 语法
npm run lint

# 或者手动检查
node -c src/theme/ThemeFramework.ts
node -c src/utils/themeFrameworkInit.ts
node -c src/screens/Home/Views/Setting/settings/Basic/ThemeFramework.tsx
```

## 当前代码状态

### 最近的提交

1. ✅ `37a9da6` - feat: 实现主题框架系统
2. ✅ `82b2748` - fix: 修复 APK 签名问题
3. ❌ `8337eec` - feat: 集成主题框架系统到应用设置（构建失败）

### 新增文件检查

所有新增文件语法正确：
- ✅ `src/theme/ThemeFramework.ts`
- ✅ `src/theme/ThemeFrameworkExports.ts`
- ✅ `src/utils/themeFrameworkInit.ts`
- ✅ `src/components/common/ThemedButton.tsx`
- ✅ `src/components/common/ThemedCard.tsx`
- ✅ `src/components/common/ThemedListItem.tsx`
- ✅ `src/components/settings/ThemeFrameworkSetting.tsx`
- ✅ `src/screens/Home/Views/Setting/settings/Basic/ThemeFramework.tsx`

### 修改文件检查

- ✅ `src/core/init/theme.ts` - 添加初始化调用
- ✅ `src/screens/Home/Views/Setting/settings/Basic/index.tsx` - 添加组件引用
- ✅ `android/app/build.gradle` - 修复签名配置

## 可能的问题

从日志来看，构建过程中有很多 deprecated API 警告，但这些是正常的（来自 react-native-navigation）。

**最可能的原因**：
1. 构建超时（GitHub Actions 免费版限制）
2. 网络问题导致依赖下载失败
3. Gradle daemon 内存不足

**建议操作**：
1. 重新运行构建（Re-run jobs）
2. 如果再次失败，查看完整的错误日志
3. 根据具体错误信息进行修复

## 如何避免构建失败

### 1. 本地测试
推送前在本地构建测试：
```bash
cd android
./gradlew assembleRelease
```

### 2. 增量提交
将大的改动拆分成多个小提交，每次提交后检查构建状态。

### 3. 使用 Draft PR
对于大的功能，先创建 Draft Pull Request，确保构建通过后再合并。

### 4. 监控构建
推送后立即查看 GitHub Actions 页面，如果失败立即处理。

## 联系方式

如果需要帮助，可以：
1. 在 GitHub Issues 中提问
2. 查看完整的构建日志
3. 提供错误信息的截图

---

**更新时间**：2026-02-09
**状态**：等待重新运行构建
