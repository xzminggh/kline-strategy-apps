# Local APK Build Guide (Windows)

> Expo SDK 57 + React Native 0.86.2 → Android APK
> Platform: Windows (PowerShell only, no WSL/Docker)
> Verified: 2026-08-01

---

## Environment Variables (Auto-Detect)

All paths use environment variables, no hardcoding:

| Variable | Purpose | Default |
|----------|---------|---------|
| `$env:USERPROFILE` | User home | `C:\Users\<username>` |
| `$env:ANDROID_HOME` | Android SDK | `$env:LOCALAPPDATA\Android\Sdk` |
| `$env:JAVA_HOME` | JDK path | Must set manually |

**Key paths:**

```
JDK 17:        $env:USERPROFILE\.jdks\jdk-17.0.2
Gradle cache:  $env:USERPROFILE\.gradle\wrapper\dists\gradle-9.3.1-bin\
Android SDK:   $env:ANDROID_HOME
CMake:         $env:ANDROID_HOME\cmake\3.30.5
NDK:           $env:ANDROID_HOME\ndk\27.1.12297006
```

---

## Dependencies

| Dep | Version | Download |
|-----|---------|----------|
| JDK | 17.0.2 | `https://mirrors.huaweicloud.com/openjdk/17.0.2/openjdk-17.0.2_windows-x64_bin.zip` |
| Gradle | 9.3.1 | `https://services.gradle.org/distributions/gradle-9.3.1-bin.zip` |
| CMake | 3.30.5 | Android SDK Manager |
| NDK | 27.1.x | Android SDK Manager |

---

## Setup Steps

### 1. Install JDK 17

```powershell
$JdkDir = "$env:USERPROFILE\.jdks"
$JdkZip = "$JdkDir\jdk-17.zip"

mkdir -Force $JdkDir
curl.exe -L -o $JdkZip `
  "https://mirrors.huaweicloud.com/openjdk/17.0.2/openjdk-17.0.2_windows-x64_bin.zip" `
  --connect-timeout 30 --max-time 300

Expand-Archive -Path $JdkZip -DestinationPath $JdkDir -Force
& "$JdkDir\jdk-17.0.2\bin\java.exe" -version
```

### 2. Download Gradle 9.3.1

```powershell
$GradleZip = "$env:TEMP\gradle-9.3.1.zip"

curl.exe -L -k --connect-timeout 30 --max-time 600 `
  -o $GradleZip `
  "https://services.gradle.org/distributions/gradle-9.3.1-bin.zip" `
  -H "User-Agent: Mozilla/5.0"

# Resume if interrupted
curl.exe -L -k -C - --max-time 600 `
  -o $GradleZip `
  "https://services.gradle.org/distributions/gradle-9.3.1-bin.zip"
```

### 3. Fix CMake (if missing)

```powershell
$CmakeDir = "$env:ANDROID_HOME\cmake"
$OldCmake = "$CmakeDir\3.22.1\bin\cmake.exe"
$NewCmake = "$CmakeDir\3.30.5\bin\cmake.exe"

if (-not (Test-Path $OldCmake) -and (Test-Path $NewCmake)) {
    Copy-Item "$CmakeDir\3.30.5\*" -Destination "$CmakeDir\3.22.1" -Recurse -Force
}
```

---

## Build APK

### Quick Build (Single Arch, Default)

```powershell
cd $AppPath
npx expo prebuild --platform android --clean

# Set single arch
(Get-Content "android\gradle.properties") -replace
  'reactNativeArchitectures=.*',
  'reactNativeArchitectures=arm64-v8a' |
  Set-Content "android\gradle.properties"

# Build
$env:JAVA_HOME = "$env:USERPROFILE\.jdk\jdk-17.0.2"
cd android
.\gradlew assembleRelease --no-daemon --parallel
```

### Full Build (All Arch)

```powershell
# Skip architecture change, build directly
$env:JAVA_HOME = "$env:USERPROFILE\.jdks\jdk-17.0.2"
cd android
.\gradlew assembleRelease --no-daemon --parallel
```

---

## Architecture Comparison

| Arch | APK Size | Build Time | Coverage |
|------|----------|------------|----------|
| `arm64-v8a` (single) | ~30MB | 8-10 min | 95%+ modern phones |
| All (4 archs) | ~120MB | 20-30 min | All Android devices |

**Recommendation:** Default single arch, full arch for release.

---

## Common Errors

### 1. JDK 17 not found
```
Cannot find a Java installation matching: {languageVersion=17}
```
**Fix:** Install JDK 17 + configure `gradle.properties`

### 2. Kotlin metadata mismatch
```
metadata version is 2.3.0, but compiler version 2.1.0
```
**Fix:** Use Gradle 9.3.1 (not 9.4.1)

### 3. CMake exe not found
```
Cannot run program "cmake.exe": CreateProcess error=2
```
**Fix:** Copy entire CMake 3.30.5 directory (not just exe)

### 4. Gradle download timeout
```
java.net.ConnectException: Connection timed out
```
**Fix:** Use `curl.exe` not `Invoke-WebRequest`

### 5. EAS local build unsupported
```
Unsupported platform, macOS or Linux is required
```
**Fix:** Use `gradlew assembleRelease`

---

## Migration Guide

### On Another Machine

1. Install JDK 17 to `$env:USERPROFILE\.jdks\jdk-17.0.2`
2. Install Android SDK via Android Studio
3. Set env var: `[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")`
4. Copy `build-apk.ps1` to project root

### In Another Agent

Copy this skill to one of:

```
# Project level
.opencode/skills/local-apk-build/SKILL.md

# Global level
~/.config/opencode/skills/local-apk-build/SKILL.md

# Claude compatible (auto-load)
~/.claude/skills/local-apk-build/SKILL.md
```

---

## Experience Summary

### Positive ✅
1. Pure Windows works (no WSL/Docker needed)
2. curl better than Invoke-WebRequest
3. Single arch much faster (8min vs 25min)
4. Gradle 9.3.1 is correct for Expo SDK 57

### Negative ❌
1. Don't upgrade Gradle (Kotlin version mismatch)
2. Don't modify node_modules Kotlin versions
3. Don't use PowerShell for large downloads
4. Don't copy only cmake.exe (need full directory)
5. Don't use EAS local build (no Windows support)
