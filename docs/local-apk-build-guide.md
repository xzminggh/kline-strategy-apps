# 本地 APK 构建完整指南 (Windows)

> 适用场景：Expo SDK 57 + React Native 0.86.2 项目，在 Windows 环境下本地构建 Android APK
> 验证日期：2026-08-01
> 构建耗时：单架构约 8-10 分钟，全架构约 20-30 分钟

---

## 一、技术路线说明

### 采用方案：纯 Windows + PowerShell + JDK 17

**未使用 WSL/Docker**，原因：
1. WSL 中访问 Windows 文件系统性能差（/mnt/c 延迟高）
2. Android SDK、Gradle 缓存都在 Windows 原生路径
3. PowerShell 已足够处理所有构建任务
4. 避免 WSL 与 Windows 环境变量冲突

### 构建链路

```
expo prebuild → gradlew assembleRelease → app-release.apk
         ↓                    ↓
   生成 android/ 目录    Gradle 编译原生代码
         ↓                    ↓
   配置 gradle.properties   使用 JDK 17 + Gradle 9.3.1
```

---

## 二、环境依赖清单

| 依赖 | 版本 | 用途 | 下载路径 |
|------|------|------|----------|
| JDK | 17.0.2 | React Native Gradle Plugin 编译 | `https://mirrors.huaweicloud.com/openjdk/17.0.2/openjdk-17.0.2_windows-x64_bin.zip` |
| Gradle | 9.3.1 | 构建工具（必须与 Expo SDK 版本匹配） | `https://services.gradle.org/distributions/gradle-9.3.1-bin.zip` |
| CMake | 3.30.5 | 原生代码编译 | Android SDK Manager 安装 |
| NDK | 27.1.12297006 | Android 原生开发包 | Android SDK Manager 安装 |
| Node.js | 22.x | Expo CLI 运行 | 已有 |

### 关键路径

| 内容 | 路径 |
|------|------|
| JDK 17 | `C:\Users\Administrator\.jdks\jdk-17.0.2` |
| Gradle 缓存 | `C:\Users\Administrator\.gradle\wrapper\dists\gradle-9.3.1-bin\` |
| Android SDK | `C:\Users\Administrator\AppData\Local\Android\Sdk` |
| CMake | `C:\Users\Administrator\AppData\Local\Android\Sdk\cmake\3.30.5` |
| NDK | `C:\Users\Administrator\AppData\Local\Android\Sdk\ndk\27.1.12297006` |

---

## 三、环境搭建步骤

### 步骤 1：安装 JDK 17

```powershell
# 创建目录
mkdir -Force "C:\Users\Administrator\.jdks"

# 下载（华为镜像，国内可达）
curl.exe -L -o "C:\Users\Administrator\.jdks\jdk-17.zip" `
  "https://mirrors.huaweicloud.com/openjdk/17.0.2/openjdk-17.0.2_windows-x64_bin.zip" `
  --connect-timeout 30 --max-time 300

# 解压
Expand-Archive -Path "C:\Users\Administrator\.jdks\jdk-17.zip" `
  -DestinationPath "C:\Users\Administrator\.jdks" -Force

# 验证
& "C:\Users\Administrator\.jdks\jdk-17.0.2\bin\java.exe" -version
```

**避坑：**
- ❌ 不要用 `Invoke-WebRequest` 下载大文件（超时机制不完善）
- ✅ 用 `curl.exe`（Windows 自带，支持断点续传）
- ❌ 不要用 Tsinghua 镜像（路径已失效 404）
- ✅ 华为镜像稳定可达

### 步骤 2：下载 Gradle 9.3.1

```powershell
# 创建临时目录
mkdir -Force "C:\temp"

# 下载（注意：必须用 curl，PowerShell 会超时）
curl.exe -L -k --connect-timeout 30 --max-time 600 `
  -o "C:\temp\gradle-9.3.1.zip" `
  "https://services.gradle.org/distributions/gradle-9.3.1-bin.zip" `
  -H "User-Agent: Mozilla/5.0"

# 如果中断，用 -C 继续下载
curl.exe -L -k -C - --max-time 600 `
  -o "C:\temp\gradle-9.3.1.zip" `
  "https://services.gradle.org/distributions/gradle-9.3.1-bin.zip"
```

**避坑：**
- ❌ `services.gradle.org` 连接慢（中国网络），但能通
- ❌ `Invoke-WebRequest` 会卡死（没有进度显示，超时机制差）
- ✅ `curl.exe` 有进度显示，支持断点续传
- ❌ 不要用腾讯/阿里云镜像（连接超时或文件不全）
- ✅ 直连 `services.gradle.org` 虽慢但能完成

### 步骤 3：配置 Gradle Wrapper

```powershell
# 设置 wrapper 指向 9.3.1
Set-Content -Path "android\gradle\wrapper\gradle-wrapper.properties" -Value @"
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-9.3.1-bin.zip
networkTimeout=60000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
"@
```

### 步骤 4：配置 gradle.properties

在 `android\gradle.properties` 中添加：

```properties
# JDK 17 工具链配置
org.gradle.java.installations.auto-download=false
org.gradle.java.installations.paths=C:\\Users\\Administrator\\.jdks\\jdk-17.0.2
```

### 步骤 5：修复 CMake

如果 Android SDK 的 CMake 3.22.1 目录存在但缺少 `cmake.exe`：

```powershell
# 将 3.30.5 的完整内容复制到 3.22.1
$src = "C:\Users\Administrator\AppData\Local\Android\Sdk\cmake\3.30.5"
$dst = "C:\Users\Administrator\AppData\Local\Android\Sdk\cmake\3.22.1"
Copy-Item "$src\*" -Destination $dst -Recurse -Force
```

**避坑：**
- ❌ 不能只复制 `cmake.exe`（会报 `Could not find CMAKE_ROOT`）
- ✅ 必须复制整个目录（bin + share + ...）

---

## 四、构建 APK

### 快速构建（单架构，推荐）

```powershell
# 1. 进入 app 目录
cd "F:\opencode\Single metric\kline-strategy-apps\app-D01-macd-div"

# 2. Expo prebuild
npx expo prebuild --platform android --clean

# 3. 临时改为单架构（加速构建）
(Get-Content "android\gradle.properties") -replace
  'reactNativeArchitectures=.*', 
  'reactNativeArchitectures=arm64-v8a' | 
  Set-Content "android\gradle.properties"

# 4. 构建
$env:JAVA_HOME = "C:\Users\Administrator\.jdks\jdk-17.0.2"
cd android
.\gradlew assembleRelease --no-daemon --parallel

# 5. 恢复多架构
(Get-Content "gradle.properties") -replace
  'reactNativeArchitectures=arm64-v8a', 
  'reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64' | 
  Set-Content "gradle.properties"

# 6. 复制 APK
Copy-Item "app\build\outputs\apk\release\app-release.apk" "..\kline-D01.apk"
```

### 全架构构建

```powershell
# 不修改 reactNativeArchitectures，直接构建
$env:JAVA_HOME = "C:\Users\Administrator\.jdks\jdk-17.0.2"
cd android
.\gradlew assembleRelease --no-daemon --parallel
```

---

## 五、构建耗时对比

| 模式 | 耗时 | APK 大小 | 适用场景 |
|------|------|----------|----------|
| 单架构 (arm64-v8a) | 8-10 分钟 | ~30MB | 测试验证 |
| 全架构 (4种) | 20-30 分钟 | ~120MB | 正式发布 |

---

## 六、常见错误与解决方案

### 错误 1：JDK 17 not found

```
Cannot find a Java installation matching: {languageVersion=17}
```

**原因：** React Native Gradle Plugin 需要 JDK 17，但系统只有 JDK 21

**解决：**
1. 下载安装 JDK 17（见步骤 1）
2. 在 `gradle.properties` 配置工具链路径

---

### 错误 2：Kotlin metadata version mismatch

```
Class 'kotlin.LazyKt__LazyKt' was compiled with an incompatible version of Kotlin. 
The actual metadata version is 2.3.0, but the compiler version 2.1.0 can read versions up to 2.2.0.
```

**原因：** Gradle 9.4.1 自带 Kotlin 2.3.0，但 RN 0.86.2 用 Kotlin 2.1.20

**解决：** 使用 Gradle 9.3.1（Expo SDK 57 原始版本）

❌ 不要尝试修改 node_modules 中的 Kotlin 版本（会导致连锁问题）
✅ 直接使用正确的 Gradle 版本

---

### 错误 3：CMake exe not found

```
Cannot run program "...cmake\3.22.1\bin\cmake.exe": CreateProcess error=2
```

**原因：** CMake 3.22.1 目录存在但缺少可执行文件

**解决：** 复制 CMake 3.30.5 的完整内容到 3.22.1 目录

❌ 不能只复制 exe（会报 CMAKE_ROOT 错误）
✅ 必须复制整个目录

---

### 错误 4：Gradle 下载超时

```
java.net.ConnectException: Connection timed out
```

**原因：** `services.gradle.org` 在国内连接慢

**解决：**
1. 用 `curl.exe` 替代 `Invoke-WebRequest`
2. 设置较长超时（600s）
3. 支持断点续传（`-C -`）

---

### 错误 5：EAS local build 不支持 Windows

```
Unsupported platform, macOS or Linux is required
```

**原因：** `eas build --local` 只支持 macOS/Linux

**解决：** 使用 `gradlew assembleRelease` 直接构建

---

## 七、完整脚本模板

```powershell
# build-apk.ps1 - 通用构建脚本
param(
    [string]$AppName = "app-D01-macd-div",
    [switch]$QuickBuild  # 单架构快速构建
)

$BaseDir = "F:\opencode\Single metric\kline-strategy-apps"
$AppDir = "$BaseDir\$AppName"
$JdkPath = "C:\Users\Administrator\.jdks\jdk-17.0.2"

Write-Host "=== 构建 $AppName ===" -ForegroundColor Green

# 1. Expo prebuild
Write-Host "1. Running expo prebuild..."
cd $AppDir
npx expo prebuild --platform android --clean

# 2. 配置 gradle.properties
$GpPath = "$AppDir\android\gradle.properties"
$GpContent = Get-Content $GpPath -Raw

# 添加 JDK 17 配置（如果不存在）
if ($GpContent -notmatch "org.gradle.java.installations.paths") {
    $GpContent += "`n`n# JDK 17`norg.gradle.java.installations.auto-download=false`norg.gradle.java.installations.paths=C:\\Users\\Administrator\\.jdks\\jdk-17.0.2"
}

# 单架构构建
if ($QuickBuild) {
    $GpContent = $GpContent -replace 'reactNativeArchitectures=.*', 'reactNativeArchitectures=arm64-v8a'
}

Set-Content $GpPath $GpContent

# 3. 清理缓存
Remove-Item "$AppDir\android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$AppDir\android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$AppDir\android\app\.cxx" -Recurse -Force -ErrorAction SilentlyContinue

# 4. 构建
Write-Host "2. Building APK..."
$env:JAVA_HOME = $JdkPath
cd "$AppDir\android"
.\gradlew assembleRelease --no-daemon --parallel

# 5. 恢复多架构
if ($QuickBuild) {
    $GpContent = (Get-Content $GpPath -Raw) -replace 'reactNativeArchitectures=arm64-v8a', 'reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64'
    Set-Content $GpPath $GpContent
}

# 6. 复制 APK
$ApkSrc = "$AppDir\android\app\build\outputs\apk\release\app-release.apk"
$ApkDst = "$AppDir\kline-$($AppName.Split('-')[1].ToUpper()).apk"
Copy-Item $ApkSrc $ApkDst -Force

$Size = [math]::Round((Get-Item $ApkDst).Length / 1MB, 1)
Write-Host "=== 构建完成 ===" -ForegroundColor Green
Write-Host "APK: $ApkDst ($Size MB)"
```

---

## 八、经验总结

### 正面经验 ✅

1. **纯 Windows 方案可行**：不需要 WSL/Docker，PowerShell 完全够用
2. **华为镜像可靠**：JDK 下载稳定，比清华镜像更可靠
3. **curl 优于 Invoke-WebRequest**：大文件下载必须用 curl
4. **单架构构建大幅加速**：从 20+ 分钟降到 8-10 分钟
5. **Gradle 9.3.1 是正确版本**：Expo SDK 57 生成的版本，与 Kotlin 2.1.20 兼容

### 反面经验 ❌

1. **不要升级 Gradle 版本**：9.4.1 的 Kotlin 2.3.0 与 RN 不兼容
2. **不要修改 node_modules 的 Kotlin 版本**：会导致连锁编译错误
3. **不要用 PowerShell 下载大文件**：超时机制差，没有进度显示
4. **不要只复制 cmake.exe**：必须复制整个目录
5. **不要用 EAS local build**：Windows 不支持

### 可扩展方向

1. **CI/CD 集成**：将脚本放入 GitHub Actions
2. **APK 签名**：生成正式 keystore 替代 debug 签名
3. **版本号管理**：自动从 app.json 读取版本号
4. **批量构建脚本**：支持一次构建多个 App
