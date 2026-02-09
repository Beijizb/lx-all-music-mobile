@echo off
REM APK 构建脚本 (Windows)
REM 用于快速构建和测试 APK

echo 🚀 开始构建 APK...

cd android

REM 清理旧构建
echo 🧹 清理旧构建...
call gradlew.bat clean

REM 构建 Release APK
echo 📦 构建 Release APK...
call gradlew.bat assembleRelease

REM 显示生成的 APK
echo.
echo ✅ 构建完成！
echo.
echo 📱 生成的 APK 文件：
dir /B app\build\outputs\apk\release\*.apk

echo.
echo 📍 APK 位置：
echo %CD%\app\build\outputs\apk\release\
echo.

echo 💡 提示：
echo 1. 如果安装失败，请检查 APK 签名
echo 2. 确保 android\app\debug.keystore 存在
echo 3. 或者配置正式的 release keystore

pause
