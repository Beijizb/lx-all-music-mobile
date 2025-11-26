# PowerShell script: Convert Java files from GBK to UTF-8 encoding
# Usage: .\convert-java-to-utf8.ps1

Write-Host "Starting Java file encoding conversion (GBK -> UTF-8)..." -ForegroundColor Cyan
Write-Host ""

$converted = 0
$failed = 0
$skipped = 0

# Get all Java files
$javaFiles = Get-ChildItem -Path "android\app\src\main\java" -Filter "*.java" -Recurse

if ($javaFiles.Count -eq 0) {
    Write-Host "No Java files found!" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($javaFiles.Count) Java file(s)" -ForegroundColor Cyan
Write-Host ""

$current = 0
foreach ($file in $javaFiles) {
    $current++
    Write-Progress -Activity "Converting Java files" -Status "Processing $current of $($javaFiles.Count): $($file.Name)" -PercentComplete (($current / $javaFiles.Count) * 100)
    
    try {
        # Read file raw bytes
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        
        $gbkEncoding = [System.Text.Encoding]::GetEncoding("GB2312")
        $utf8Encoding = [System.Text.Encoding]::UTF8
        
        # 先尝试用 UTF-8 读取
        $utf8Content = $utf8Encoding.GetString($bytes)
        $isUtf8 = $true
        
        # 检查 UTF-8 读取是否包含无效字符（通常是乱码）
        if ($utf8Content -match "[\uFFFD]") {
            # 包含替换字符，说明不是有效的 UTF-8
            $isUtf8 = $false
        }
        
        # 如果 UTF-8 读取失败或包含乱码，尝试 GBK
        if (-not $isUtf8) {
            try {
                $gbkContent = $gbkEncoding.GetString($bytes)
                
                # 检查 GBK 读取是否包含中文字符
                if ($gbkContent -match "[\u4e00-\u9fa5]") {
                    # 转换为 UTF-8
                    $utf8Bytes = $utf8Encoding.GetBytes($gbkContent)
                    [System.IO.File]::WriteAllBytes($file.FullName, $utf8Bytes)
                    
                    Write-Host "Converted: $($file.Name)" -ForegroundColor Green
                    $converted++
                } else {
                    # GBK read successful but no Chinese characters, skip
                    $skipped++
                }
            } catch {
                # GBK read also failed, skip
                $skipped++
            }
        } else {
            # File is already valid UTF-8, skip
            $skipped++
        }
    } catch {
        Write-Host "Failed: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Progress -Activity "Converting Java files" -Completed
Write-Host ""
Write-Host ("=" * 50) -ForegroundColor Cyan
Write-Host "Conversion completed!" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan
Write-Host "Successfully converted: $converted file(s)" -ForegroundColor Green
Write-Host "Skipped: $skipped file(s)" -ForegroundColor Yellow
Write-Host "Failed: $failed file(s)" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($converted -gt 0) {
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Check converted files (open a few files to verify Chinese comments are correct)"
    Write-Host "2. git add android/app/src/main/java"
    $commitMsg = "fix: convert Java files from GBK to UTF-8"
    Write-Host "3. git commit -m '$commitMsg'"
    Write-Host "4. git push"
    Write-Host ""
    Write-Host "After conversion, you can remove the encoding conversion step from CI" -ForegroundColor Yellow
} else {
    Write-Host "No files need conversion, all files may already be UTF-8 encoded" -ForegroundColor Yellow
}

