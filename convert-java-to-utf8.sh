#!/bin/bash
# 将 GBK 编码的 Java 文件转换为 UTF-8
# 使用方法: ./convert-java-to-utf8.sh

echo "开始转换 Java 文件编码 (GBK -> UTF-8)..."

converted=0
failed=0

find android/app/src/main/java -name "*.java" -type f | while read file; do
  # 检查文件是否已经是 UTF-8
  if file -bi "$file" | grep -q "charset=utf-8"; then
    echo "⏭️  跳过 (已是 UTF-8): $file"
    continue
  fi
  
  # 尝试从 GBK 转换到 UTF-8
  if iconv -f GBK -t UTF-8 "$file" > "$file.tmp" 2>/dev/null && [ -s "$file.tmp" ]; then
    # 验证转换后的文件包含有效的 Java 代码
    if head -n 5 "$file.tmp" | grep -qE "(package|import|public|class|//)" 2>/dev/null; then
      mv "$file.tmp" "$file"
      echo "✓ 已转换: $file"
      converted=$((converted + 1))
    else
      rm -f "$file.tmp"
      echo "✗ 转换失败 (文件无效): $file"
      failed=$((failed + 1))
    fi
  else
    rm -f "$file.tmp" 2>/dev/null || true
    echo "✗ 转换失败 (无法从 GBK 读取): $file"
    failed=$((failed + 1))
  fi
done

echo ""
echo "转换完成!"
echo "成功: $converted 个文件"
echo "失败: $failed 个文件"
echo ""
echo "下一步:"
echo "1. 检查转换后的文件是否正确"
echo "2. git add android/app/src/main/java"
echo "3. git commit -m 'fix: convert Java files from GBK to UTF-8'"
echo "4. git push"

