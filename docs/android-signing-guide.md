# Android 签名配置指南

## 问题说明

当前 CI 构建失败，错误信息：
```
KeytoolException: Failed to read key *** from store: keystore password was incorrect
```

这是因为 GitHub Secrets 中配置的 keystore 密码与实际 keystore 文件不匹配。

## 解决方案

重新生成 keystore 并更新 GitHub Secrets 配置。

## 操作步骤

### 1. 生成新的 Keystore

根据你的操作系统选择对应的脚本：

#### Windows 用户

在项目根目录打开 PowerShell，执行：

```powershell
cd scripts
.\generate-keystore.ps1
```

#### Linux/Mac 用户

在项目根目录打开终端，执行：

```bash
cd scripts
chmod +x generate-keystore.sh
./generate-keystore.sh
```

### 2. 按提示输入信息

脚本会要求你输入：

1. **Keystore 密码**（建议使用强密码，至少 6 个字符）
2. **Key 密码**（建议与 keystore 密码相同）
3. **证书信息**（可以直接回车使用默认值）：
   - 组织名称（默认：LX Music）
   - 组织单位（默认：Mobile Team）
   - 城市（默认：Beijing）
   - 省份（默认：Beijing）
   - 国家代码（默认：CN）

### 3. 查看生成的配置

脚本执行完成后会生成两个文件：

- `release.keystore` - 签名密钥文件（**请妥善保管，不要提交到 Git**）
- `keystore-secrets.txt` - GitHub Secrets 配置信息

### 4. 配置 GitHub Secrets

1. 打开你的 GitHub 仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret** 添加以下 5 个 secrets：

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `MYAPP_UPLOAD_STORE_FILE` | Keystore 文件名 | `release.keystore` |
| `MYAPP_UPLOAD_KEY_ALIAS` | Key 别名 | `release-key` |
| `MYAPP_UPLOAD_STORE_PASSWORD` | Keystore 密码 | 你设置的密码 |
| `MYAPP_UPLOAD_KEY_PASSWORD` | Key 密码 | 你设置的密码 |
| `MYAPP_KEYSTORE_BASE64` | Keystore 的 Base64 编码 | 从 `keystore-secrets.txt` 复制 |

**注意**：
- 如果 secret 已存在，需要先删除再重新创建（或点击 Update）
- `MYAPP_KEYSTORE_BASE64` 的值很长，请完整复制，不要遗漏任何字符

### 5. 重新运行 CI

配置完成后，有两种方式触发构建：

**方式 1：手动触发**
1. 进入 **Actions** 标签页
2. 选择 **Build** workflow
3. 点击 **Run workflow** → **Run workflow**

**方式 2：推送代码**
```bash
git commit --allow-empty -m "chore: 触发 CI 构建"
git push
```

## 重要提示

### ⚠️ 安全注意事项

1. **备份 keystore 文件**：`release.keystore` 和密码必须妥善保管
   - 丢失后无法恢复
   - 无法再发布应用更新（需要更换包名重新发布）

2. **不要提交到 Git**：
   - `release.keystore` 已自动添加到 `.gitignore`
   - `keystore-secrets.txt` 也已添加到 `.gitignore`
   - 请确认这些文件不会被提交

3. **密码管理**：
   - 建议使用密码管理器保存密码
   - 不要在代码或文档中明文记录密码

### 📋 验证清单

构建成功后，请验证：

- [ ] CI 构建通过，没有签名错误
- [ ] 生成的 APK 文件可以正常安装
- [ ] APK 签名信息正确（可用 `keytool -printcert -jarfile app.apk` 查看）
- [ ] `release.keystore` 已备份到安全位置
- [ ] 密码已保存到密码管理器

## 故障排查

### 问题 1：keytool 命令未找到

**解决方案**：
- 确保已安装 JDK（不是 JRE）
- 将 JDK 的 `bin` 目录添加到 PATH 环境变量
- JDK 下载地址：https://adoptium.net/

### 问题 2：CI 仍然报密码错误

**可能原因**：
1. Secrets 配置不完整或有误
2. Base64 编码复制不完整

**解决方案**：
1. 检查所有 5 个 secrets 是否都已配置
2. 重新复制 `MYAPP_KEYSTORE_BASE64` 的值（确保完整）
3. 确认密码没有多余的空格或换行符

### 问题 3：PowerShell 脚本无法执行

**错误信息**：
```
无法加载文件，因为在此系统上禁止运行脚本
```

**解决方案**：
以管理员身份运行 PowerShell，执行：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 参考资料

- [Android 应用签名文档](https://developer.android.com/studio/publish/app-signing)
- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [keytool 命令参考](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/keytool.html)
