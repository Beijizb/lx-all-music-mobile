#!/bin/bash

# 生成 Android Release Keystore 脚本
# 用于创建新的签名密钥并生成 GitHub Secrets 配置

set -e

echo "=========================================="
echo "Android Release Keystore 生成工具"
echo "=========================================="
echo ""

# 配置变量
KEYSTORE_FILE="release.keystore"
KEY_ALIAS="release-key"
VALIDITY_DAYS=10000

# 提示用户输入密码
echo "请设置 keystore 密码（建议使用强密码，至少 6 个字符）："
read -s STORE_PASSWORD
echo ""
echo "请再次输入 keystore 密码确认："
read -s STORE_PASSWORD_CONFIRM
echo ""

if [ "$STORE_PASSWORD" != "$STORE_PASSWORD_CONFIRM" ]; then
    echo "❌ 两次输入的密码不一致，请重新运行脚本"
    exit 1
fi

echo "请设置 key 密码（建议与 keystore 密码相同）："
read -s KEY_PASSWORD
echo ""
echo "请再次输入 key 密码确认："
read -s KEY_PASSWORD_CONFIRM
echo ""

if [ "$KEY_PASSWORD" != "$KEY_PASSWORD_CONFIRM" ]; then
    echo "❌ 两次输入的密码不一致，请重新运行脚本"
    exit 1
fi

# 提示用户输入证书信息
echo ""
echo "请输入证书信息（可以使用默认值）："
echo -n "组织名称 [LX Music]: "
read ORG_NAME
ORG_NAME=${ORG_NAME:-"LX Music"}

echo -n "组织单位 [Mobile Team]: "
read ORG_UNIT
ORG_UNIT=${ORG_UNIT:-"Mobile Team"}

echo -n "城市 [Beijing]: "
read CITY
CITY=${CITY:-"Beijing"}

echo -n "省份 [Beijing]: "
read STATE
STATE=${STATE:-"Beijing"}

echo -n "国家代码 [CN]: "
read COUNTRY
COUNTRY=${COUNTRY:-"CN"}

# 生成 DN (Distinguished Name)
DN="CN=${ORG_NAME}, OU=${ORG_UNIT}, L=${CITY}, ST=${STATE}, C=${COUNTRY}"

echo ""
echo "=========================================="
echo "开始生成 keystore..."
echo "=========================================="

# 删除旧的 keystore（如果存在）
if [ -f "$KEYSTORE_FILE" ]; then
    echo "⚠️  发现已存在的 $KEYSTORE_FILE，将被覆盖"
    rm -f "$KEYSTORE_FILE"
fi

# 生成新的 keystore
keytool -genkeypair \
    -v \
    -storetype PKCS12 \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity "$VALIDITY_DAYS" \
    -storepass "$STORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "$DN"

echo ""
echo "✅ Keystore 生成成功: $KEYSTORE_FILE"
echo ""

# 生成 base64 编码
echo "=========================================="
echo "生成 Base64 编码..."
echo "=========================================="

if command -v base64 &> /dev/null; then
    KEYSTORE_BASE64=$(base64 -w 0 "$KEYSTORE_FILE" 2>/dev/null || base64 "$KEYSTORE_FILE" | tr -d '\n')
    echo "✅ Base64 编码生成成功"
else
    echo "❌ 未找到 base64 命令，请手动转换"
    exit 1
fi

# 生成配置文件
echo ""
echo "=========================================="
echo "GitHub Secrets 配置"
echo "=========================================="
echo ""
echo "请在 GitHub 仓库设置中添加以下 Secrets："
echo "（Settings -> Secrets and variables -> Actions -> New repository secret）"
echo ""
echo "1. MYAPP_UPLOAD_STORE_FILE"
echo "   值: $KEYSTORE_FILE"
echo ""
echo "2. MYAPP_UPLOAD_KEY_ALIAS"
echo "   值: $KEY_ALIAS"
echo ""
echo "3. MYAPP_UPLOAD_STORE_PASSWORD"
echo "   值: $STORE_PASSWORD"
echo ""
echo "4. MYAPP_UPLOAD_KEY_PASSWORD"
echo "   值: $KEY_PASSWORD"
echo ""
echo "5. MYAPP_KEYSTORE_BASE64"
echo "   值: (见下方，复制完整内容)"
echo ""
echo "=========================================="
echo "MYAPP_KEYSTORE_BASE64 内容："
echo "=========================================="
echo "$KEYSTORE_BASE64"
echo "=========================================="
echo ""

# 保存到文件
cat > keystore-secrets.txt << EOF
========================================
GitHub Secrets 配置信息
生成时间: $(date)
========================================

请在 GitHub 仓库中设置以下 Secrets：
Settings -> Secrets and variables -> Actions -> New repository secret

1. MYAPP_UPLOAD_STORE_FILE
   $KEYSTORE_FILE

2. MYAPP_UPLOAD_KEY_ALIAS
   $KEY_ALIAS

3. MYAPP_UPLOAD_STORE_PASSWORD
   $STORE_PASSWORD

4. MYAPP_UPLOAD_KEY_PASSWORD
   $KEY_PASSWORD

5. MYAPP_KEYSTORE_BASE64
   $KEYSTORE_BASE64

========================================
重要提示
========================================
1. 请妥善保管此文件和 $KEYSTORE_FILE
2. 不要将此文件提交到 Git 仓库
3. 建议将密码保存到密码管理器中
4. $KEYSTORE_FILE 文件已自动添加到 .gitignore

EOF

echo "✅ 配置信息已保存到: keystore-secrets.txt"
echo ""

# 添加到 .gitignore
if [ -f ".gitignore" ]; then
    if ! grep -q "$KEYSTORE_FILE" .gitignore; then
        echo "" >> .gitignore
        echo "# Android Release Keystore" >> .gitignore
        echo "$KEYSTORE_FILE" >> .gitignore
        echo "keystore-secrets.txt" >> .gitignore
        echo "✅ 已将 keystore 文件添加到 .gitignore"
    fi
else
    echo "⚠️  未找到 .gitignore 文件，请手动添加 $KEYSTORE_FILE 到忽略列表"
fi

echo ""
echo "=========================================="
echo "完成！"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. 查看 keystore-secrets.txt 文件获取完整配置"
echo "2. 在 GitHub 仓库中设置上述 5 个 Secrets"
echo "3. 重新运行 CI 构建"
echo ""
echo "⚠️  重要：请备份 $KEYSTORE_FILE 和密码，丢失后无法恢复！"
echo ""
