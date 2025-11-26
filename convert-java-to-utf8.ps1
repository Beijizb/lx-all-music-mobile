# PowerShell 脚本：将 GBK 编码的 Java 文件转换为 UTF-8
# 使用方法: .\convert-java-to-utf8.ps1

Write-Host "开始转换 Java 文件编码 (GBK -> UTF-8)..." -ForegroundColor Cyan

$converted = 0
$failed = 0

$javaFiles = Get-ChildItem -Path "android\app\src\main\java" -Filter "*.java" -Recurse

foreach ($file in $javaFiles) {
    try {
        # 读取文件内容（尝试 GBK 编码）
        $content = Get-Content -Path $file.FullName -Encoding Default -Raw -ErrorAction Stop
        
        # 检查是否包含中文字符（GBK 编码的特征）
        if ($content -match "[\u4e00-\u9fa5]") {
            # 将内容转换为 UTF-8 并保存
            $utf8Content = [System.Text.Encoding]::Convert(
                [System.Text.Encoding]::GetEncoding("GB2312"),
                [System.Text.Encoding]::UTF8,
                [System.Text.Encoding]::GetEncoding("GB2312").GetBytes($content)
            )
            $utf8String = [System.Text.Encoding]::UTF8.GetString($utf8Content)
            
            # 保存为 UTF-8（带 BOM）
            [System.IO.File]::WriteAllText($file.FullName, $utf8String, [System.Text.Encoding]::UTF8)
            
            Write-Host "✓ 已转换: $($file.FullName)" -ForegroundColor Green
            $converted++
        } else {
            Write-Host "⏭️  跳过 (无中文字符): $($file.FullName)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ 转换失败: $($file.FullName) - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "转换完成!" -ForegroundColor Cyan
Write-Host "成功: $converted 个文件" -ForegroundColor Green
Write-Host "失败: $failed 个文件" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""
Write-Host "下一步:" -ForegroundColor Cyan
Write-Host "1. 检查转换后的文件是否正确"
Write-Host "2. git add android/app/src/main/java"
Write-Host "3. git commit -m 'fix: convert Java files from GBK to UTF-8'"
Write-Host "4. git push"

