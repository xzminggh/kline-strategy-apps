# K线策略App索引

**生成时间:** 2026-07-29
**总数量:** 26个独立App

---

## App列表

| ID | 策略名称 | 目录 | 颜色 | 启动命令 |
|----|----------|------|------|----------|
| T01 | 双均线金叉/死叉 | app-T01-double-ma | #3b82f6 | `cd app-T01-double-ma && npm start` |
| T02 | 60日均线多空分界 | app-T02-ma60 | #10b981 | `cd app-T02-ma60 && npm start` |
| T03 | 顾比均线组穿越 | app-T03-guppy | #8b5cf6 | `cd app-T03-guppy && npm start` |
| T04 | 三线反向反转 | app-T04-three-line | #f59e0b | `cd app-T04-three-line && npm start` |
| M01 | 布林带触轨反弹 | app-M01-bollinger | #ef4444 | `cd app-M01-bollinger && npm start` |
| M02 | RSI超买超卖 | app-M02-rsi | #ec4899 | `cd app-M02-rsi && npm start` |
| M03 | 三重过滤 | app-M03-triple | #06b6d4 | `cd app-M03-triple && npm start` |
| M04 | 缺口回补 | app-M04-gap | #84cc16 | `cd app-M04-gap && npm start` |
| P01 | MOM动量穿零轴 | app-P01-mom | #f97316 | `cd app-P01-mom && npm start` |
| P02 | ROC+放量确认 | app-P02-roc | #14b8a6 | `cd app-P02-roc && npm start` |
| P03 | 倍量突破前高/前低 | app-P03-volume | #a855f7 | `cd app-P03-volume && npm start` |
| P04 | 大阴线/大阳线反包 | app-P04-engulfing | #64748b | `cd app-P04-engulfing && npm start` |
| S01 | 双底/双顶颈线突破 | app-S01-double-bottom | #0ea5e9 | `cd app-S01-double-bottom && npm start` |
| S02 | 三角形整理末端突破 | app-S02-triangle | #22c55e | `cd app-S02-triangle && npm start` |
| S03 | 头肩底/顶颈线突破 | app-S03-head-shoulder | #eab308 | `cd app-S03-head-shoulder && npm start` |
| S04 | 锤子线/流星线确认 | app-S04-hammer | #dc2626 | `cd app-S04-hammer && npm start` |
| K01 | 均线支撑/压力回踩 | app-K01-ma-support | #7c3aed | `cd app-K01-ma-support && npm start` |
| K02 | 前高变支撑/前低变阻力 | app-K02-prev-highlow | #0891b2 | `cd app-K02-prev-highlow && npm start` |
| K03 | 斐波那契回撤共振 | app-K03-fibonacci | #059669 | `cd app-K03-fibonacci && npm start` |
| V01 | 布林带收口突破 | app-V01-boll-squeeze | #d946ef | `cd app-V01-boll-squeeze && npm start` |
| V02 | ATR窄幅后方向选择 | app-V02-atr | #f43f5e | `cd app-V02-atr && npm start` |
| Q01 | 地量见底 | app-Q01-low-volume | #2563eb | `cd app-Q01-low-volume && npm start` |
| Q02 | 天量逃顶 | app-Q02-high-volume | #dc2626 | `cd app-Q02-high-volume && npm start` |
| D01 | MACD底/顶背离 | app-D01-macd-div | #7c3aed | `cd app-D01-macd-div && npm start` |
| D02 | RSI隐性背离 | app-D02-rsi-div | #2563eb | `cd app-D02-rsi-div && npm start` |
| D03 | CCI极端拐点 | app-D03-cci | #ea580c | `cd app-D03-cci && npm start` |

---

## 项目结构

```
kline-strategy-apps/
├── shared/                    # 共享模块
│   ├── indicators/            # 技术指标算法
│   ├── services/              # 数据抓取服务
│   ├── database/              # SQLite数据库
│   ├── components/            # UI组件
│   └── theme/                 # 主题色
├── app-template/              # 母版App
├── app-T01-double-ma/         # T01策略App
├── app-T02-ma60/              # T02策略App
├── ...                        # 其他24个App
├── scripts/                   # 脚本工具
│   ├── generate-all.js        # 批量生成脚本
│   └── test-all.js            # 批量测试脚本
└── INDEX.md                   # 本索引文件
```

---

## 快速开始

### 1. 选择一个App启动

```bash
cd app-T01-double-ma
npm install
npm start
```

### 2. 使用Expo Go调试

1. 手机安装Expo Go App
2. 运行 `npm start`
3. 扫描二维码或在Android模拟器中打开

### 3. 批量安装依赖

```bash
cd scripts
node install-all.js  # 需要创建此脚本
```

---

## 策略分类

| 类别 | 策略 |
|------|------|
| 趋势跟随 | T01, T02, T03, T04 |
| 均值回归 | M01, M02, M03, M04 |
| 动量突破 | P01, P02, P03, P04 |
| 经典形态 | S01, S02, S03, S04 |
| 关键价位 | K01, K02, K03 |
| 波动率收缩 | V01, V02 |
| 成交量极端 | Q01, Q02 |
| 多周期背离 | D01, D02, D03 |

---

## 技术栈

- React Native 0.86.0
- Expo SDK 57
- TypeScript 6.0
- SQLite (expo-sqlite)
- React Navigation 6

---

**状态:** ✅ 26个App全部生成完成
**下一步:** 选择一个App启动测试
