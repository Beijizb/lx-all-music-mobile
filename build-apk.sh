#!/bin/bash

# APK 构建脚本
# 用于快速构建和测试 APK

set -e

echo "🚀 开始构建 APK..."

# 进入 Android 目录
cd "$(dirname "$0")/android"

# 清理旧构建
echo "🧹 清理旧构建..."
./gradlew clean

# 构建 Release APK
echo "📦 构建 Release APK..."
./gradlew assembleRelease

# 查找生成的 APK
APK_DIR="app/build/outputs/apk/release"
echo ""
echo "✅ 构建完成！"
echo ""
echo "📱 生成的 APK 文件："
ls -lh "$APK_DIR"/*.apk

echo ""
echo "📍 APK 位置："
echo "$(pwd)/$APK_DIR/"

# 检查签名
echo ""
echo "🔐 检查 APK 签名..."
for apk in "$APK_DIR"/*.apk; do
    echo ""
    echo "文件: $(basename "$apk")"
    jarsigner -verify -verbose -certs "$apk" 2>&1 | grep -E "(jar verified|CN=)" || echo "⚠️  签名验证失败"
done

echo ""
echo "💡 提示："
echo "1. 如果签名验证失败，APK 将无法安装"
echo "2. 请确保 android/app/debug.keystore 存在"
echo "3. 或者配置正式的 release keystore"
