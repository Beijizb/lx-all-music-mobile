# GitHub Secrets 设置指南

## ✅ Keystore 已生成

你的 Android 签名密钥已成功生成：
- 📁 `scripts/release.keystore` - 签名密钥文件（已添加到 .gitignore）
- 📄 `scripts/keystore-secrets.txt` - 配置信息（已添加到 .gitignore）

## 🔐 设置 GitHub Secrets

### 步骤 1：打开 GitHub 仓库设置

1. 访问你的 GitHub 仓库：https://github.com/你的用户名/lx-b
2. 点击 **Settings**（设置）标签
3. 在左侧菜单中找到 **Secrets and variables** → **Actions**
4. 点击 **New repository secret** 按钮

### 步骤 2：添加以下 5 个 Secrets

#### Secret 1: MYAPP_UPLOAD_STORE_FILE
- **Name**: `MYAPP_UPLOAD_STORE_FILE`
- **Value**: `release.keystore`

#### Secret 2: MYAPP_UPLOAD_KEY_ALIAS
- **Name**: `MYAPP_UPLOAD_KEY_ALIAS`
- **Value**: `release-key`

#### Secret 3: MYAPP_UPLOAD_STORE_PASSWORD
- **Name**: `MYAPP_UPLOAD_STORE_PASSWORD`
- **Value**: `lx123456`

#### Secret 4: MYAPP_UPLOAD_KEY_PASSWORD
- **Name**: `MYAPP_UPLOAD_KEY_PASSWORD`
- **Value**: `lx123456`

#### Secret 5: MYAPP_KEYSTORE_BASE64
- **Name**: `MYAPP_KEYSTORE_BASE64`
- **Value**: 从 `scripts/keystore-secrets.txt` 文件中复制完整的 Base64 字符串

**重要提示**：
- Base64 字符串很长（约 3000+ 字符），请确保完整复制
- 不要遗漏开头或结尾的任何字符
- 可以直接从 `keystore-secrets.txt` 文件中复制

### 步骤 3：验证 Secrets 配置

配置完成后，你应该看到 5 个 secrets：
- ✅ MYAPP_UPLOAD_STORE_FILE
- ✅ MYAPP_UPLOAD_KEY_ALIAS
- ✅ MYAPP_UPLOAD_STORE_PASSWORD
- ✅ MYAPP_UPLOAD_KEY_PASSWORD
- ✅ MYAPP_KEYSTORE_BASE64

### 步骤 4：触发 CI 构建

有两种方式重新运行构建：

**方式 1：手动触发**
1. 进入仓库的 **Actions** 标签页
2. 选择左侧的 **Build** workflow
3. 点击右上角的 **Run workflow** 按钮
4. 选择 `main` 分支
5. 点击绿色的 **Run workflow** 按钮

**方式 2：推送代码触发**
```bash
git add .gitignore
git commit -m "chore: 更新 .gitignore，添加 keystore 配置文件忽略规则"
git push
```

## ⚠️ 重要安全提示

### 1. 备份 Keystore
- **立即备份** `scripts/release.keystore` 文件到安全位置
- 将密码保存到密码管理器（如 1Password、LastPass、Bitwarden）
- **丢失后无法恢复**，将无法发布应用更新

### 2. 不要提交到 Git
- ✅ `release.keystore` 已添加到 .gitignore
- ✅ `keystore-secrets.txt` 已添加到 .gitignore
- 运行 `git status` 确认这些文件不在待提交列表中

### 3. 密码安全
- 当前密码：`lx123456`（建议使用更强的密码）
- 不要在公开场合分享密码
- 不要在代码或文档中明文记录

## 📋 故障排查

### 问题 1：CI 仍然报密码错误

**检查清单**：
- [ ] 确认所有 5 个 secrets 都已添加
- [ ] 确认 secret 名称完全正确（区分大小写）
- [ ] 确认 Base64 字符串完整复制（没有遗漏）
- [ ] 确认密码没有多余的空格或换行符

**解决方案**：
1. 删除所有 5 个 secrets
2. 重新添加，仔细检查每个值
3. 特别注意 Base64 字符串要完整

### 问题 2：找不到 keystore 文件

**错误信息**：
```
Failed to read key *** from store: No such file or directory
```

**解决方案**：
- 检查 `MYAPP_UPLOAD_STORE_FILE` 的值是否为 `release.keystore`
- 检查 `MYAPP_KEYSTORE_BASE64` 是否正确配置

### 问题 3：Base64 解码失败

**错误信息**：
```
base64: invalid input
```

**解决方案**：
- 重新复制 Base64 字符串，确保完整
- 检查是否有多余的空格或换行符
- 可以重新运行 `generate-keystore.ps1` 生成新的 keystore

## ✅ 验证成功

构建成功后，你会看到：
- ✅ CI 构建通过，没有签名错误
- ✅ 生成的 APK 文件：`app-v版本号-universal.apk`
- ✅ APK 可以正常安装到 Android 设备

## 📚 相关文档

- [Android 应用签名文档](https://developer.android.com/studio/publish/app-signing)
- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [项目构建失败排查指南](./android-signing-guide.md)

---

**生成时间**: 2026-02-09
**Keystore 文件**: scripts/release.keystore
**配置文件**: scripts/keystore-secrets.txt
