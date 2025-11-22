# 本地编译 APK 指南

## 前置要求

1. **Node.js** >= 18
2. **Java JDK** 17
3. **Android SDK** (通过 Android Studio 安装)
4. **环境变量配置**：
   - `ANDROID_HOME` 或 `ANDROID_SDK_ROOT` 指向 Android SDK 目录
   - `JAVA_HOME` 指向 JDK 17 目录

## 环境配置

### 安装 Java JDK 17

1. **下载 JDK 17**：
   - 推荐使用 Microsoft Build of OpenJDK: https://learn.microsoft.com/en-us/java/openjdk/download
   - 或 Oracle JDK: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
   - 或 Adoptium (Eclipse Temurin): https://adoptium.net/

2. **配置 JAVA_HOME 环境变量**：
   
   **Windows 方法一（PowerShell，临时）：**
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
   $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
   ```
   
   **Windows 方法二（永久设置）：**
   1. 右键"此电脑" -> "属性" -> "高级系统设置"
   2. 点击"环境变量"
   3. 在"系统变量"中点击"新建"
   4. 变量名：`JAVA_HOME`
   5. 变量值：JDK 安装路径（如：`C:\Program Files\Java\jdk-17`）
   6. 编辑 `PATH` 变量，添加：`%JAVA_HOME%\bin`

3. **验证安装**：
   ```bash
   java -version
   # 应该显示 java version "17.x.x"
   ```

### 安装 Android SDK

1. **安装 Android Studio**：
   - 下载：https://developer.android.com/studio
   - 安装时选择 "Standard" 安装，会自动安装 Android SDK

2. **配置 ANDROID_HOME**：
   
   **Windows 默认路径**：
   ```
   C:\Users\YourName\AppData\Local\Android\Sdk
   ```
   
   **设置环境变量**：
   ```powershell
   $env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"
   $env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools;$env:PATH"
   ```
   
   或通过系统环境变量永久设置（方法同上）

## 编译步骤

### 方法一：使用 npm 脚本（推荐）

#### 1. 安装依赖
```bash
npm install
```

#### 2. 编译 Release APK
```bash
npm run pack:android
```

或者直接使用 Gradle：
```bash
cd android
gradlew.bat assembleRelease
```

#### 3. 编译 Debug APK（用于测试）
```bash
npm run pack:android:debug
```

或者：
```bash
cd android
gradlew.bat assembleDebug
```

### 方法二：使用 Android Studio

1. 用 Android Studio 打开 `android` 目录
2. 等待 Gradle 同步完成
3. 点击 `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`
4. 选择 `release` 或 `debug` 构建变体

## APK 输出位置

编译完成后，APK 文件位于：

- **Release APK**: `android/app/build/outputs/apk/release/`
  - `lx-b-v2.0.0-arm64-v8a.apk` (ARM 64位)
  - `lx-b-v2.0.0-armeabi-v7a.apk` (ARM 32位)
  - `lx-b-v2.0.0-x86_64.apk` (x86 64位)
  - `lx-b-v2.0.0-x86.apk` (x86 32位)
  - `lx-b-v2.0.0-universal.apk` (通用版本，包含所有架构)

- **Debug APK**: `android/app/build/outputs/apk/debug/`

## 签名说明

当前配置使用 **debug 签名** 来构建 release APK（用于测试）。

如果要使用正式签名，需要：

1. 创建 keystore 文件
2. 在 `android/app/` 目录创建 `keystore.properties` 文件：
   ```properties
   storeFile=your-release-key.keystore
   keyAlias=your-key-alias
   storePassword=your-store-password
   keyPassword=your-key-password
   ```

## 常见问题

### 1. 找不到 gradlew.bat
确保你在 `android` 目录下运行命令，或者使用完整路径。

### 2. 内存不足
编辑 `android/gradle.properties`，增加内存：
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=2048m
```

### 3. 构建失败 - 找不到 Android SDK
确保设置了 `ANDROID_HOME` 环境变量：
```bash
# Windows PowerShell
$env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"
```

### 4. keytool 错误：别名已存在
如果遇到 `Key pair not generated, alias <androiddebugkey> already exists` 错误：

**解决方法**：
- 删除现有的 debug.keystore 文件：
  ```bash
  cd android/app
  del debug.keystore
  ```
- 或者直接使用现有的 keystore（如果已存在，Gradle 会自动使用）

### 5. 清理构建缓存
```bash
npm run clear
```

完全清理：
```bash
npm run clear:full
```

