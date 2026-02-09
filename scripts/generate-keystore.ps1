$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Android Release Keystore Generator" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$KEYSTORE_FILE = "release.keystore"
$KEY_ALIAS = "release-key"
$VALIDITY_DAYS = 10000

try {
    $null = Get-Command keytool -ErrorAction Stop
} catch {
    Write-Host "keytool not found. Please install JDK" -ForegroundColor Red
    exit 1
}

Write-Host "Set keystore password (min 6 chars):"
$STORE_PASSWORD = Read-Host -AsSecureString
$STORE_PASSWORD_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($STORE_PASSWORD))

Write-Host "Confirm keystore password:"
$STORE_PASSWORD_CONFIRM = Read-Host -AsSecureString
$STORE_PASSWORD_CONFIRM_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($STORE_PASSWORD_CONFIRM))

if ($STORE_PASSWORD_TEXT -ne $STORE_PASSWORD_CONFIRM_TEXT) {
    Write-Host "Passwords do not match" -ForegroundColor Red
    exit 1
}

Write-Host "Set key password (recommend same as keystore):"
$KEY_PASSWORD = Read-Host -AsSecureString
$KEY_PASSWORD_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($KEY_PASSWORD))

Write-Host "Confirm key password:"
$KEY_PASSWORD_CONFIRM = Read-Host -AsSecureString
$KEY_PASSWORD_CONFIRM_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($KEY_PASSWORD_CONFIRM))

if ($KEY_PASSWORD_TEXT -ne $KEY_PASSWORD_CONFIRM_TEXT) {
    Write-Host "Passwords do not match" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Certificate info (press Enter for defaults):"
$ORG_NAME = Read-Host "Organization [LX Music]"
if ([string]::IsNullOrWhiteSpace($ORG_NAME)) { $ORG_NAME = "LX Music" }

$ORG_UNIT = Read-Host "Unit [Mobile Team]"
if ([string]::IsNullOrWhiteSpace($ORG_UNIT)) { $ORG_UNIT = "Mobile Team" }

$CITY = Read-Host "City [Beijing]"
if ([string]::IsNullOrWhiteSpace($CITY)) { $CITY = "Beijing" }

$STATE = Read-Host "State [Beijing]"
if ([string]::IsNullOrWhiteSpace($STATE)) { $STATE = "Beijing" }

$COUNTRY = Read-Host "Country [CN]"
if ([string]::IsNullOrWhiteSpace($COUNTRY)) { $COUNTRY = "CN" }

$DN = "CN=$ORG_NAME, OU=$ORG_UNIT, L=$CITY, ST=$STATE, C=$COUNTRY"

Write-Host ""
Write-Host "Generating keystore..." -ForegroundColor Cyan

if (Test-Path $KEYSTORE_FILE) {
    Remove-Item $KEYSTORE_FILE -Force
}

$keytoolArgs = @(
    "-genkeypair", "-v", "-storetype", "PKCS12",
    "-keystore", $KEYSTORE_FILE, "-alias", $KEY_ALIAS,
    "-keyalg", "RSA", "-keysize", "2048",
    "-validity", $VALIDITY_DAYS,
    "-storepass", $STORE_PASSWORD_TEXT,
    "-keypass", $KEY_PASSWORD_TEXT,
    "-dname", $DN
)

try {
    & keytool $keytoolArgs
    Write-Host "Keystore generated successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Generating Base64..." -ForegroundColor Cyan

try {
    $keystoreBytes = [System.IO.File]::ReadAllBytes($KEYSTORE_FILE)
    $KEYSTORE_BASE64 = [System.Convert]::ToBase64String($keystoreBytes)
    Write-Host "Base64 generated successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "GitHub Secrets Configuration" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. MYAPP_UPLOAD_STORE_FILE" -ForegroundColor White
Write-Host "   $KEYSTORE_FILE" -ForegroundColor Gray
Write-Host ""
Write-Host "2. MYAPP_UPLOAD_KEY_ALIAS" -ForegroundColor White
Write-Host "   $KEY_ALIAS" -ForegroundColor Gray
Write-Host ""
Write-Host "3. MYAPP_UPLOAD_STORE_PASSWORD" -ForegroundColor White
Write-Host "   $STORE_PASSWORD_TEXT" -ForegroundColor Gray
Write-Host ""
Write-Host "4. MYAPP_UPLOAD_KEY_PASSWORD" -ForegroundColor White
Write-Host "   $KEY_PASSWORD_TEXT" -ForegroundColor Gray
Write-Host ""
Write-Host "5. MYAPP_KEYSTORE_BASE64" -ForegroundColor White
Write-Host "   (see below)" -ForegroundColor Gray
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host $KEYSTORE_BASE64 -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$fileContent = "GitHub Secrets Configuration`n"
$fileContent += "Generated: $timestamp`n`n"
$fileContent += "1. MYAPP_UPLOAD_STORE_FILE`n   $KEYSTORE_FILE`n`n"
$fileContent += "2. MYAPP_UPLOAD_KEY_ALIAS`n   $KEY_ALIAS`n`n"
$fileContent += "3. MYAPP_UPLOAD_STORE_PASSWORD`n   $STORE_PASSWORD_TEXT`n`n"
$fileContent += "4. MYAPP_UPLOAD_KEY_PASSWORD`n   $KEY_PASSWORD_TEXT`n`n"
$fileContent += "5. MYAPP_KEYSTORE_BASE64`n   $KEYSTORE_BASE64`n"

$fileContent | Out-File -FilePath "keystore-secrets.txt" -Encoding UTF8
Write-Host "Config saved to: keystore-secrets.txt" -ForegroundColor Green
Write-Host ""

if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -notmatch [regex]::Escape($KEYSTORE_FILE)) {
        Add-Content ".gitignore" "`n# Android Release Keystore"
        Add-Content ".gitignore" $KEYSTORE_FILE
        Add-Content ".gitignore" "keystore-secrets.txt"
        Write-Host "Added to .gitignore" -ForegroundColor Green
    }
} else {
    Write-Host ".gitignore not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done! Next steps:" -ForegroundColor Cyan
Write-Host "1. Check keystore-secrets.txt for full config"
Write-Host "2. Set the 5 secrets in GitHub repo settings"
Write-Host "3. Re-run CI build"
Write-Host ""
Write-Host "IMPORTANT: Backup release.keystore and passwords!" -ForegroundColor Red
Write-Host ""
