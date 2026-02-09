# 软件远程更新实现指南

## 当前项目的更新机制

### 1. 更新流程架构

```
┌─────────────────┐
│  应用启动/手动  │
│   检查更新      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 从多个源获取    │
│  version.json   │ ← GitHub Raw / jsDelivr CDN
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  比较版本号     │
│ (compareVer)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 显示更新弹窗    │
│ (VersionModal)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  下载 APK       │
│ (GitHub Release)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  安装 APK       │
│ (installApk)    │
└─────────────────┘
```

### 2. 核心文件说明

#### **版本信息获取** (`src/utils/version.js`)
```javascript
// 多源获取版本信息，自动重试
export const getVersionInfo = async (index = 0) => {
  const sources = [
    'https://raw.githubusercontent.com/...',
    'https://cdn.jsdelivr.net/gh/...',
    'https://fastly.jsdelivr.net/gh/...',
  ]
  // 失败自动切换下一个源
}

// 下载 APK
export const downloadNewVersion = async (version, onDownload) => {
  // 1. 检测设备 ABI (arm64-v8a, armeabi-v7a, etc.)
  const abi = await getTargetAbi()

  // 2. 构建下载 URL
  const url = `https://github.com/${author}/${repo}/releases/download/v${version}/${repo}-v${version}-${abi}.apk`

  // 3. 下载到临时目录
  downloadFile(url, savePath, {
    progressInterval: 500,  // 进度回调间隔
    begin({ contentLength }) {
      onDownload(contentLength, 0)
    },
    progress({ contentLength, bytesWritten }) {
      onDownload(contentLength, bytesWritten)
    },
  })
}
```

#### **版本管理** (`src/core/version.ts`)
```javascript
// 检查更新
export const checkUpdate = async (silent = false) => {
  // 1. 获取版本信息
  const { version, desc, history } = await getVersionInfo()

  // 2. 比较版本号
  if (compareVer(currentVersion, newVersion) != -1) {
    // 已是最新版本
  }

  // 3. 显示更新弹窗（如果有新版本）
  if (!isLatest && !silent) {
    showModal()
  }
}

// 下载更新
export const downloadUpdate = () => {
  downloadNewVersion(version, (total, current) => {
    // 更新下载进度
    versionActions.setProgress({ total, current })
  })
}
```

#### **UI 界面** (`src/navigation/components/VersionModal.tsx`)
- 显示版本信息和更新日志
- 实时显示下载进度
- 提供操作按钮：
  - **立即更新** - 下载并安装
  - **忽略此版本** - 不再提示该版本
  - **关闭** - 稍后更新

### 3. 版本信息格式

需要在 GitHub 仓库的 `publish/version.json` 文件：

```json
{
  "version": "2.0.1",
  "desc": "- 新增主题框架系统\n- 修复已知问题",
  "history": [
    {
      "version": "2.0.0",
      "desc": "- 初始版本发布"
    }
  ]
}
```

### 4. 发布流程

#### 步骤 1：构建 APK
```bash
cd android
./gradlew assembleRelease
```

#### 步骤 2：创建 GitHub Release
```bash
# 创建 tag
git tag v2.0.1
git push origin v2.0.1

# 上传 APK 到 Release
# 文件命名格式：lx-b-v2.0.1-arm64-v8a.apk
```

#### 步骤 3：更新版本信息
在 `publish/version.json` 中更新版本号和更新日志

---

## 你遇到的安装错误解决方案

### 错误原因
```
INSTALL_PARSE_FAILED_NO_CERTIFICATES: Failed to collect certificates
```
这表示 APK **签名验证失败**。

### 问题分析
从你的 git 历史看到：
```
9c20bda fix: 彻底移除 release 签名配置，生成 unsigned APK
```

**unsigned APK 无法安装！** Android 要求所有 APK 必须签名。

### 解决方案

#### 方案 1：使用 Debug 签名（推荐用于测试）

修改 `android/app/build.gradle`：

```gradle
buildTypes {
    release {
        signingConfig signingConfigs.debug  // 使用 debug 签名
        minifyEnabled false
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

#### 方案 2：生成正式签名（推荐用于发布）

1. **生成 keystore**：
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore lx-b-release.keystore -alias lx-b-key -keyalg RSA -keysize 2048 -validity 10000
```

2. **创建 `android/keystore.properties`**：
```properties
MYAPP_UPLOAD_STORE_FILE=app/lx-b-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=lx-b-key
MYAPP_UPLOAD_STORE_PASSWORD=你的密码
MYAPP_UPLOAD_KEY_PASSWORD=你的密码
```

3. **添加到 .gitignore**：
```
android/keystore.properties
android/app/*.keystore
```

#### 方案 3：快速修复（立即可用）

直接使用 debug 签名构建：

```bash
cd android
./gradlew assembleRelease -PsigningConfig=debug
```

或者修改 `build.gradle` 第 146 行：
```gradle
release {
    signingConfig signingConfigs.debug  // 强制使用 debug 签名
    minifyEnabled false
}
```

### 重新构建并测试

```bash
# 1. 清理旧构建
cd android
./gradlew clean

# 2. 构建 release APK
./gradlew assembleRelease

# 3. 查找生成的 APK
# 位置：android/app/build/outputs/apk/release/
```

---

## 自动更新最佳实践

### 1. 版本号管理
在 `package.json` 中：
```json
{
  "version": "2.0.1",
  "versionCode": 20001
}
```

### 2. 多 ABI 支持
```javascript
const abis = ['arm64-v8a', 'armeabi-v7a', 'x86_64', 'x86', 'universal']
```

### 3. 下载优化
- 使用多个 CDN 源
- 支持断点续传
- 显示下载进度
- 错误重试机制

### 4. 用户体验
- 自动检查更新（可配置）
- 忽略版本功能
- 后台下载
- 安装前确认

---

## 常见问题

### Q1: 如何禁用自动检查更新？
在设置中关闭"自动检查更新"选项，或修改 `defaultSetting.ts`：
```typescript
'version.autoCheckUpdate': false
```

### Q2: 如何更改更新源？
修改 `src/utils/version.js` 中的 `address` 数组。

### Q3: 如何测试更新功能？
1. 修改 `package.json` 中的版本号为较低版本
2. 在 GitHub 创建一个更高版本的 Release
3. 在应用中点击"检查更新"

### Q4: 为什么下载失败？
- 检查网络连接
- 确认 GitHub Release 中有对应 ABI 的 APK
- 检查文件命名格式是否正确

---

## 总结

这个项目使用了完整的 OTA（Over-The-Air）更新方案：

✅ **多源版本检测** - GitHub + CDN
✅ **智能 ABI 选择** - 自动匹配设备架构
✅ **进度显示** - 实时下载进度
✅ **自动安装** - 下载完成后自动安装
✅ **版本管理** - 支持忽略版本、查看历史

**当前问题**：APK 未正确签名，需要使用 debug 或 release keystore 签名后才能安装。
