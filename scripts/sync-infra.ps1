# sync-infra.ps1 — Sync T01's infrastructure to all 25 other apps
# Preserves each app's existing strategy.ts (if any)
# Safe: never modifies T01

$root = "F:\opencode\Single metric\kline-strategy-apps"
$t01 = "$root\app-T01-double-ma"

$apps = Get-ChildItem -Path $root -Directory -Filter "app-*" |
    Where-Object { $_.Name -ne "app-template" -and $_.Name -ne "app-T01-double-ma" } |
    ForEach-Object { $_.Name }

Write-Host "Found $($apps.Count) apps to sync (excluding T01 and template)"

# Files to copy from T01 root level
$rootFiles = @("package.json", "tsconfig.json", "index.js", ".easignore")

# Directories to copy from T01 src/ (excluding config/ which has strategy.ts)
$srcDirs = @("shared", "screens", "types")
$srcFiles = @("App.tsx")  # Note: App.tsx is in src/, not src/theme/

# Theme dir: copy from T01 src/theme/ (but it just re-exports from shared)
$themeDir = "theme"

$successCount = 0
$failCount = 0

foreach ($app in $apps) {
    $appDir = "$root\$app"
    Write-Host "`n--- Syncing: $app ---"
    
    try {
        # 1. Backup existing strategy.ts (if any)
        $strategyPath = "$appDir\src\config\strategy.ts"
        $strategyBackup = $null
        if (Test-Path $strategyPath) {
            $strategyBackup = Get-Content $strategyPath -Raw
            Write-Host "  Backed up existing strategy.ts"
        }
        
        # 2. Ensure src/ directory structure exists
        $dirsToCreate = @(
            "$appDir\src\shared\indicators",
            "$appDir\src\shared\services",
            "$appDir\src\shared\database",
            "$appDir\src\shared\components",
            "$appDir\src\shared\theme",
            "$appDir\src\screens",
            "$appDir\src\types",
            "$appDir\src\theme",
            "$appDir\src\config"
        )
        foreach ($d in $dirsToCreate) {
            if (!(Test-Path $d)) {
                New-Item -ItemType Directory -Path $d -Force | Out-Null
            }
        }
        
        # 3. Remove old shared/ contents (if any) and copy fresh from T01
        $oldShared = "$appDir\src\shared"
        if (Test-Path $oldShared) {
            # Remove all .ts and .tsx files in shared/ subdirectories
            Get-ChildItem -Path $oldShared -Recurse -Include "*.ts","*.tsx" | Remove-Item -Force -ErrorAction SilentlyContinue
            # Remove shared/ subdirectories
            Get-ChildItem -Path $oldShared -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
            # Remove shared root files
            Get-ChildItem -Path $oldShared -File | Remove-Item -Force -ErrorAction SilentlyContinue
        }
        
        # 4. Copy T01's shared/ to app's src/shared/
        $t01Shared = "$t01\src\shared"
        $destShared = "$appDir\src\shared"
        
        # Copy indicators/
        Copy-Item "$t01Shared\indicators\*" "$destShared\indicators\" -Force
        # Copy services/
        Copy-Item "$t01Shared\services\*" "$destShared\services\" -Force
        # Copy database/
        Copy-Item "$t01Shared\database\*" "$destShared\database\" -Force
        # Copy components/
        Copy-Item "$t01Shared\components\*" "$destShared\components\" -Force
        # Copy theme/
        Copy-Item "$t01Shared\theme\*" "$destShared\theme\" -Force
        
        Write-Host "  Copied shared/ (indicators, services, database, components, theme)"
        
        # 5. Copy screens/
        $t01Screens = "$t01\src\screens"
        $destScreens = "$appDir\src\screens"
        Copy-Item "$t01Screens\*" "$destScreens\" -Force
        Write-Host "  Copied screens/"
        
        # 6. Copy types/
        Copy-Item "$t01\src\types\*" "$appDir\src\types\" -Force
        Write-Host "  Copied types/"
        
        # 7. Copy theme/ (src/theme/colors.ts)
        Copy-Item "$t01\src\theme\*" "$appDir\src\theme\" -Force
        Write-Host "  Copied theme/"
        
        # 8. Copy App.tsx
        Copy-Item "$t01\src\App.tsx" "$appDir\src\App.tsx" -Force
        Write-Host "  Copied App.tsx"
        
        # 9. Copy root config files
        foreach ($f in $rootFiles) {
            $src = "$t01\$f"
            $dst = "$appDir\$f"
            if (Test-Path $src) {
                Copy-Item $src $dst -Force
            }
        }
        Write-Host "  Copied root config files (package.json, tsconfig.json, index.js, .easignore)"
        
        # 10. Restore strategy.ts (if we had one)
        if ($strategyBackup) {
            # Ensure config/ directory exists
            if (!(Test-Path "$appDir\src\config")) {
                New-Item -ItemType Directory -Path "$appDir\src\config" -Force | Out-Null
            }
            Set-Content -Path $strategyPath -Value $strategyBackup -Encoding UTF8
            Write-Host "  Restored strategy.ts"
        }
        
        $successCount++
        Write-Host "  OK: $app"
        
    } catch {
        $failCount++
        Write-Host "  FAIL: $app - $($_.Exception.Message)"
    }
}

Write-Host "`n=== Summary ==="
Write-Host "Synced: $successCount"
Write-Host "Failed: $failCount"
Write-Host "Total: $($apps.Count)"
