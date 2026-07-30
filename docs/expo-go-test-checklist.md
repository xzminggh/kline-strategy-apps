# 26 Apps Expo Go 测试清单

## 测试流程（每个App）
1. `npx expo start` 启动
2. 手机Expo Go扫码
3. 验证：首页加载、股票列表、搜索、设置页、策略分析页
4. 修复发现的问题
5. `npx tsc --noEmit` 确保无类型错误
6. 记录状态

## 清单

| # | App | 策略 | 状态 | 问题记录 |
|---|-----|------|------|----------|
| 1 | app-T01-double-ma | 双均线金叉/死叉 | ⏳待测试 | |
| 2 | app-T02-ma60 | 60日均线多空 | ⏳待测试 | |
| 3 | app-T03-guppy | 顾比均线组 | ⏳待测试 | |
| 4 | app-T04-three-line | 三线反转 | ⏳待测试 | |
| 5 | app-M01-bollinger | 布林带触轨 | ⏳待测试 | |
| 6 | app-M02-rsi | RSI超买超卖 | ⏳待测试 | |
| 7 | app-M03-triple | 三重过滤 | ⏳待测试 | |
| 8 | app-M04-gap | 缺口回补 | ⏳待测试 | |
| 9 | app-P01-mom | MOM动量 | ⏳待测试 | |
| 10 | app-P02-roc | ROC放量 | ⏳待测试 | |
| 11 | app-P03-volume | 倍量突破 | ⏳待测试 | |
| 12 | app-P04-engulfing | 反包形态 | ⏳待测试 | |
| 13 | app-S01-double-bottom | 双底/双顶 | ⏳待测试 | |
| 14 | app-S02-triangle | 三角形整理 | ⏳待测试 | |
| 15 | app-S03-head-shoulder | 头肩底/顶 | ⏳待测试 | |
| 16 | app-S04-hammer | 锤子线/流星线 | ⏳待测试 | |
| 17 | app-K01-ma-support | 均线支撑回踩 | ⏳待测试 | |
| 18 | app-K02-prev-highlow | 前高变支撑 | ⏳待测试 | |
| 19 | app-K03-fibonacci | 斐波那契回撤 | ⏳待测试 | |
| 20 | app-V01-boll-squeeze | 布林带收口 | ⏳待测试 | |
| 21 | app-V02-atr | ATR窄幅 | ⏳待测试 | |
| 22 | app-Q01-low-volume | 地量见底 | ⏳待测试 | |
| 23 | app-Q02-high-volume | 天量逃顶 | ⏳待测试 | |
| 24 | app-D01-macd-div | MACD背离 | ⏳待测试 | |
| 25 | app-D02-rsi-div | RSI隐性背离 | ⏳待测试 | |
| 26 | app-D03-cci | CCI极端拐点 | ⏳待测试 | |

## 测试结果统计
- 已通过：0/26
- 待测试：26/26
- 有问题：0/26
