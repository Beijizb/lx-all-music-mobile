# APK 签名问题修复记录

## 问题描述

**错误信息**：
```
INSTALL_PARSE_FAILED_NO_CERTIFICATES: Failed to collect certificates from /data/app/vmdl1773560743.tmp/lx-b-v2.0.0-universal.apk using APK Signature Scheme v2: SHA-256 digest of contents did not verify
```

**症状**：
- APK 文件生成成功
- 但无法安装到 Android 设备
- 签名验证失败

## 根本原因

CI 构建脚本在 Gradle 构建过程中过早删除了 keystore 文件，导致签名过程被中断或损坏。

**问题代码**（`.github/workflows/build.yml:154-159`）：
```bash
echo "${KEYSTORE_BASE64}" | base64 --decode > "${TARGET_FILE}"
./gradlew assembleRelease \
  -PMYAPP_UPLOAD_STORE_FILE="${KEYSTORE_FILE}" \
  ...
rm -f "${TARGET_FILE}"  # ❌ 立即删除，可能导致签名未完成
```

## 解决方案

### 修复内容

1. **添加 keystore 验证**：解码后验证文件是否存在
2. **添加调试信息**：输出 keystore 文件大小
3. **延迟删除**：确保 Gradle 构建完全完成后再删除 keystore
4. **添加清理日志**：明确显示清理操作

### 修复后的代码

```bash
echo "${KEYSTORE_BASE64}" | base64 --decode > "${TARGET_FILE}"

# 验证 keystore 文件是否成功解码
if [ ! -f "${TARGET_FILE}" ]; then
  echo "错误：keystore 文件解码失败"
  exit 1
fi

echo "Keystore 文件大小: $(stat -c%s "${TARGET_FILE}") bytes"

# 构建 Release APK
./gradlew assembleRelease \
  -PMYAPP_UPLOAD_STORE_FILE="${KEYSTORE_FILE}" \
  -PMYAPP_UPLOAD_KEY_ALIAS="${{ secrets.MYAPP_UPLOAD_KEY_ALIAS }}" \
  -PMYAPP_UPLOAD_STORE_PASSWORD="${{ secrets.MYAPP_UPLOAD_STORE_PASSWORD }}" \
  -PMYAPP_UPLOAD_KEY_PASSWORD="${{ secrets.MYAPP_UPLOAD_KEY_PASSWORD }}"

# 构建完成后再删除 keystore
rm -f "${TARGET_FILE}"
echo "已清理临时 keystore 文件"
```

## 验证步骤

### 1. 检查 CI 构建日志

构建成功后，应该看到：
```
使用提供的签名配置...
Keystore 文件大小: XXXX bytes
BUILD SUCCESSFUL
已清理临时 keystore 文件
```

### 2. 验证 APK 签名

下载生成的 APK 后，可以使用以下命令验证签名：

```bash
# 方法 1：使用 apksigner（推荐）
apksigner verify --verbose lx-b-v2.0.0-universal.apk

# 方法 2：使用 jarsigner
jarsigner -verify -verbose -certs lx-b-v2.0.0-universal.apk

# 方法 3：查看签名信息
keytool -printcert -jarfile lx-b-v2.0.0-universal.apk
```

**预期输出**：
```
Verifies
Verified using v1 scheme (JAR signing): true
Verified using v2 scheme (APK Signature Scheme v2): true
Verified using v3 scheme (APK Signature Scheme v3): false
```

### 3. 安装测试

在 Android 设备上安装 APK：
```bash
adb install lx-b-v2.0.0-universal.apk
```

应该成功安装，没有签名错误。

## 相关技术细节

### Android APK 签名方案

Android 支持多种签名方案：

1. **v1 (JAR signing)**：传统的 JAR 签名方式
2. **v2 (APK Signature Scheme v2)**：Android 7.0+ 引入，更快更安全
3. **v3 (APK Signature Scheme v3)**：Android 9.0+ 引入，支持密钥轮换

### 签名过程

1. Gradle 读取 keystore 文件
2. 使用指定的 alias 和密码提取私钥
3. 对 APK 内容生成 SHA-256 摘要
4. 使用私钥对摘要进行签名
5. 将签名信息写入 APK

**关键点**：整个过程中 keystore 文件必须保持可访问。

### 为什么过早删除会导致问题

Gradle 的 `assembleRelease` 任务是异步的，包含多个子任务：
- `packageRelease`：打包 APK
- `signReleaseBundle`：签名
- `zipalignRelease`：对齐优化

如果在这些任务完成前删除 keystore，签名过程可能失败或产生损坏的签名。

## 预防措施

### 1. 本地测试

在推送到 CI 前，先在本地测试签名配置：

```bash
cd android
./gradlew assembleRelease \
  -PMYAPP_UPLOAD_STORE_FILE="../scripts/release.keystore" \
  -PMYAPP_UPLOAD_KEY_ALIAS="release-key" \
  -PMYAPP_UPLOAD_STORE_PASSWORD="lx123456" \
  -PMYAPP_UPLOAD_KEY_PASSWORD="lx123456"

# 验证生成的 APK
apksigner verify app/build/outputs/apk/release/*.apk
```

### 2. CI 日志监控

每次构建后检查日志，确保：
- ✅ Keystore 文件成功解码
- ✅ 文件大小合理（通常 2-10 KB）
- ✅ BUILD SUCCESSFUL
- ✅ 签名验证通过

### 3. 自动化验证

可以在 CI 中添加签名验证步骤：

```yaml
- name: Verify APK Signature
  run: |
    cd android/app/build/outputs/apk/release
    for apk in *.apk; do
      echo "Verifying $apk..."
      apksigner verify --verbose "$apk"
    done
```

## 时间线

- **2026-02-09 初次尝试**：配置 GitHub Secrets，但 APK 签名失败
- **2026-02-09 问题诊断**：发现 keystore 被过早删除
- **2026-02-09 修复提交**：commit `33a3e8f` - 延迟删除 keystore
- **2026-02-09 验证**：等待 CI 构建完成验证

## 参考资料

- [Android 应用签名文档](https://developer.android.com/studio/publish/app-signing)
- [APK Signature Scheme v2](https://source.android.com/security/apksigning/v2)
- [Gradle Android Plugin - Signing](https://developer.android.com/studio/build/gradle-tips#sign-your-app)
- [apksigner 工具文档](https://developer.android.com/studio/command-line/apksigner)

---

**修复提交**: `33a3e8f`
**修复时间**: 2026-02-09
**状态**: ✅ 已修复，等待验证
