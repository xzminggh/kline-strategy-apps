# AGENTS.md

## 核心规则

### Expo Go测试 + 云打包流程
**必须逐个App进行：Expo Go调试成功 → 用户确认 → 再云打包。禁止一次性批量打包26个App。**

流程：
1. 选择一个App
2. `npx expo start` 在Expo Go中测试
3. 修复发现的问题
4. 用户确认"可以打包"
5. `eas build --platform android --profile preview --non-interactive --no-wait`
6. 回到步骤1，选择下一个App

### EAS云打包注意事项
- 必须设置 `EAS_PROJECT_ROOT` 指向具体App目录（避免打包整个monorepo的node_modules）
- 必须设置 `EAS_SKIP_AUTO_FINGERPRINT=1`
- 每个App需要独立的EAS项目（`eas init --non-interactive --json --force`）
- app.json中必须有`owner`字段
- `package-lock.json`必须与`package.json`同步
- 使用 `--no-wait` 避免等待构建完成阻塞后续操作
- Expo免费计划每月15次Android构建

### 用户偏好
- 推荐选项放A位
- 所有终端命令使用PowerShell格式
- `debug-logs/`不纳入git
- 重要修复后必须落盘经验日志

### GitHub用户名
- Gitee: xzmingmy
- GitHub: xzminggh（注意不是xzmingmy）
