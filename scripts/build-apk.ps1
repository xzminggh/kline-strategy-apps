<#
.SYNOPSIS
    Build Android APK for Expo/React Native apps on Windows.

.DESCRIPTION
    Automates the full build process: expo prebuild, gradle config, build, copy APK.
    Uses environment variables for all paths - no hardcoding.

.PARAMETER AppPath
    Path to the app directory (e.g., .\app-D01-macd-div)

.PARAMETER Arch
    Target architecture. Default: arm64-v8a (single arch, fast)

.PARAMETER AllArch
    Build for all architectures (slow but compatible with all devices)

.PARAMETER SkipPrebuild
    Skip expo prebuild (use if android/ already exists)

.EXAMPLE
    .\build-apk.ps1 -AppPath ".\app-D01-macd-div"
    .\build-apk.ps1 -AppPath ".\app-D02-rsi-div" -AllArch
    .\build-apk.ps1 -AppPath ".\app-D01-macd-div" -SkipPrebuild
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$AppPath,

    [string]$Arch = "arm64-v8a",

    [switch]$AllArch,

    [switch]$SkipPrebuild
)

# ===== Auto-detect paths =====
$JdkPath = "$env:USERPROFILE\.jdks\jdk-17.0.2"
$AppDir = (Resolve-Path $AppPath).Path

if ($AllArch) {
    $Arch = "armeabi-v7a,arm64-v8a,x86,x86_64"
}

# ===== Validate =====
if (-not (Test-Path $JdkPath)) {
    Write-Host "ERROR: JDK 17 not found at $JdkPath" -ForegroundColor Red
    Write-Host "Please install JDK 17 first. See docs/local-apk-build-guide.md" -ForegroundColor Yellow
    exit 1
}

$AndroidSdk = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $AndroidSdk)) {
    # Try ANDROID_HOME
    $AndroidSdk = $env:ANDROID_HOME
}
if (-not $AndroidSdk -or -not (Test-Path $AndroidSdk)) {
    Write-Host "ERROR: Android SDK not found" -ForegroundColor Red
    Write-Host "Set ANDROID_HOME env var or install Android Studio" -ForegroundColor Yellow
    exit 1
}

# ===== Start =====
$AppFolder = Split-Path $AppDir -Leaf
Write-Host "========================================" -ForegroundColor Green
Write-Host " Building: $AppFolder" -ForegroundColor Green
Write-Host " Architecture: $Arch" -ForegroundColor Green
Write-Host " JDK: $JdkPath" -ForegroundColor Green
Write-Host " Android SDK: $AndroidSdk" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Step 1: Expo prebuild
if (-not $SkipPrebuild) {
    Write-Host "`n[1/5] Running expo prebuild..." -ForegroundColor Cyan
    Push-Location $AppDir
    npx expo prebuild --platform android --clean
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: expo prebuild failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
} else {
    Write-Host "`n[1/5] Skipping prebuild" -ForegroundColor Yellow
}

# Step 2: Configure gradle.properties
Write-Host "[2/5] Configuring gradle.properties..." -ForegroundColor Cyan
$GpPath = Join-Path $AppDir "android\gradle.properties"

if (-not (Test-Path $GpPath)) {
    Write-Host "ERROR: gradle.properties not found at $GpPath" -ForegroundColor Red
    Write-Host "Run expo prebuild first or remove -SkipPrebuild flag" -ForegroundColor Yellow
    exit 1
}

$Gp = Get-Content $GpPath -Raw

# Add JDK 17 config if missing
if ($Gp -notmatch "org.gradle.java.installations.paths") {
    $JdkPathEscaped = $JdkPath -replace '\\', '\\\\'
    $Gp += "`n`n# JDK 17`norg.gradle.java.installations.auto-download=false`norg.gradle.java.installations.paths=$JdkPathEscaped"
}

# Set architecture
$Gp = $Gp -replace 'reactNativeArchitectures=.*', "reactNativeArchitectures=$Arch"
Set-Content $GpPath $Gp

# Step 3: Clean build cache
Write-Host "[3/5] Cleaning build cache..." -ForegroundColor Cyan
$CleanDirs = @(
    (Join-Path $AppDir "android\.gradle"),
    (Join-Path $AppDir "android\app\build"),
    (Join-Path $AppDir "android\app\.cxx")
)
foreach ($Dir in $CleanDirs) {
    Remove-Item $Dir -Recurse -Force -ErrorAction SilentlyContinue
}

# Step 4: Build
Write-Host "[4/5] Building APK (this takes 8-10 min for single arch)..." -ForegroundColor Cyan
$env:JAVA_HOME = $JdkPath

Push-Location (Join-Path $AppDir "android")
.\gradlew assembleRelease --no-daemon --parallel
$BuildResult = $LASTEXITCODE
Pop-Location

if ($BuildResult -ne 0) {
    Write-Host "`n=== BUILD FAILED ===" -ForegroundColor Red
    Write-Host "Check error messages above" -ForegroundColor Yellow
    exit 1
}

# Step 5: Copy APK
Write-Host "[5/5] Copying APK..." -ForegroundColor Cyan
$ApkSrc = Join-Path $AppDir "android\app\build\outputs\apk\release\app-release.apk"
$ApkDst = Join-Path $AppDir "kline-$AppFolder.apk"

if (Test-Path $ApkSrc) {
    Copy-Item $ApkSrc $ApkDst -Force
    $Size = [math]::Round((Get-Item $ApkDst).Length / 1MB, 1)
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host " BUILD SUCCESS" -ForegroundColor Green
    Write-Host " APK: $ApkDst" -ForegroundColor Green
    Write-Host " Size: $Size MB" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "`n=== BUILD FAILED ===" -ForegroundColor Red
    Write-Host "APK not found at: $ApkSrc" -ForegroundColor Yellow
    exit 1
}
