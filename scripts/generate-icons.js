const fs = require('fs');
const path = require('path');

const SIZE = 1024;
const C = SIZE / 2; // center

function svg(content, bg = '#1a1a2e') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="200" fill="url(#bg)"/>
  ${content}
</svg>`;
}

function line(x1, y1, x2, y2, color, width = 12) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}

function polyline(points, color, width = 12, fill = 'none') {
  return `<polyline points="${points}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function circle(cx, cy, r, color, fill = 'none', width = 8) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${color}" stroke-width="${width}"/>`;
}

function rect(x, y, w, h, color, rx = 0) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" rx="${rx}"/>`;
}

function text(x, y, content, color = '#fff', size = 80, anchor = 'middle') {
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Arial,sans-serif" font-weight="bold" text-anchor="${anchor}">${content}</text>`;
}

function svgPath(d, color, width = 12, fill = 'none') {
  return `<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// Arrow helper
function arrow(x1, y1, x2, y2, color, width = 12) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 40;
  const ax = x2 - headLen * Math.cos(angle - Math.PI / 6);
  const ay = y2 - headLen * Math.sin(angle - Math.PI / 6);
  const bx = x2 - headLen * Math.cos(angle + Math.PI / 6);
  const by = y2 - headLen * Math.sin(angle + Math.PI / 6);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>
  <polygon points="${x2},${y2} ${ax},${ay} ${bx},${by}" fill="${color}"/>`;
}

const icons = {
  'app-T01-double-ma': {
    name: 'T01',
    label: '双均线',
    draw() {
      // Two crossing MA lines
      return [
        line(200, 700, 500, 450, '#e94560', 16),
        line(500, 450, 820, 550, '#e94560', 16),
        line(200, 600, 500, 500, '#0f3460', 16),
        line(500, 500, 820, 350, '#0f3460', 16),
        circle(500, 475, 25, '#ffd700', '#ffd700', 0),
        text(C, 900, 'T01', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-T02-ma60': {
    name: 'T02',
    label: 'MA60',
    draw() {
      return [
        line(180, 600, 400, 550, '#e94560', 10),
        line(400, 550, 550, 520, '#e94560', 10),
        line(550, 520, 700, 580, '#e94560', 10),
        line(180, 350, 840, 350, '#ffd700', 20),
        text(860, 340, '60', '#ffd700', 80, 'start'),
        arrow(700, 580, 750, 400, '#10b981', 14),
        text(C, 900, 'T02', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-T03-guppy': {
    name: 'T03',
    label: '顾比',
    draw() {
      let lines = '';
      const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
      for (let i = 0; i < 5; i++) {
        const yOff = 350 + i * 40;
        lines += line(200, yOff + 100, 500, yOff - 50, colors[i], 10);
        lines += line(500, yOff - 50, 820, yOff + 30, colors[i], 10);
      }
      return [
        lines,
        arrow(500, 450, 650, 280, '#fff', 10),
        text(C, 900, 'T03', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-T04-three-line': {
    name: 'T04',
    label: '三线',
    draw() {
      return [
        line(200, 500, 450, 350, '#ef4444', 14),
        line(450, 350, 820, 450, '#ef4444', 14),
        line(200, 600, 450, 450, '#f97316', 14),
        line(450, 450, 820, 550, '#f97316', 14),
        line(200, 700, 450, 550, '#eab308', 14),
        line(450, 550, 820, 650, '#eab308', 14),
        circle(820, 450, 18, '#10b981', '#10b981', 0),
        text(C, 900, 'T04', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-M01-bollinger': {
    name: 'M01',
    label: 'BOLL',
    draw() {
      return [
        // Upper band
        svgPath('M200,300 Q400,280 500,320 Q600,360 820,300', '#3b82f6', 10),
        // Middle band
        svgPath('M200,450 Q400,430 500,470 Q600,510 820,450', '#ffd700', 10),
        // Lower band
        svgPath('M200,600 Q400,580 500,620 Q600,660 820,600', '#3b82f6', 10),
        // Price touching lower band
        circle(500, 620, 20, '#10b981', '#10b981', 0),
        arrow(500, 620, 600, 470, '#10b981', 12),
        text(C, 900, 'M01', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-M02-rsi': {
    name: 'M02',
    label: 'RSI',
    draw() {
      return [
        // Overbought line
        line(180, 300, 840, 300, '#ef4444', 6),
        text(860, 310, '70', '#ef4444', 60, 'start'),
        // Oversold line
        line(180, 600, 840, 600, '#10b981', 6),
        text(860, 610, '30', '#10b981', 60, 'start'),
        // RSI wave
        svgPath('M200,500 Q300,450 350,520 Q400,600 450,350 Q500,250 550,300 Q600,350 650,480 Q700,550 800,450', '#ffd700', 10),
        text(C, 900, 'M02', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-M03-triple': {
    name: 'M03',
    label: '三重',
    draw() {
      return [
        // Filter 1
        rect(200, 280, 620, 100, 'none'),
        line(200, 330, 820, 330, '#ef4444', 8),
        text(170, 340, '1', '#ef4444', 70, 'end'),
        // Filter 2
        rect(200, 420, 620, 100, 'none'),
        line(200, 470, 820, 470, '#f97316', 8),
        text(170, 480, '2', '#f97316', 70, 'end'),
        // Filter 3
        rect(200, 560, 620, 100, 'none'),
        line(200, 610, 820, 610, '#22c55e', 8),
        text(170, 620, '3', '#22c55e', 70, 'end'),
        arrow(820, 610, 880, 610, '#ffd700', 12),
        text(C, 900, 'M03', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-M04-gap': {
    name: 'M04',
    label: '缺口',
    draw() {
      return [
        // Candle 1 (up)
        rect(250, 350, 80, 300, '#ef4444', 8),
        line(290, 300, 290, 350, '#ef4444', 6),
        line(290, 650, 290, 700, '#ef4444', 6),
        // Gap
        rect(380, 380, 80, 10, '#fff', 0),
        text(420, 440, 'GAP', '#ffd700', 50),
        // Candle 2 (gap up)
        rect(510, 200, 80, 250, '#ef4444', 8),
        line(550, 150, 550, 200, '#ef4444', 6),
        line(550, 450, 550, 500, '#ef4444', 6),
        // Candle 3 (fill back)
        rect(650, 300, 80, 350, '#10b981', 8),
        line(690, 250, 690, 300, '#10b981', 6),
        line(690, 650, 690, 700, '#10b981', 6),
        text(C, 900, 'M04', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-P01-mom': {
    name: 'P01',
    label: 'MOM',
    draw() {
      return [
        // Zero line
        line(180, 500, 840, 500, '#666', 6),
        // MOM wave
        svgPath('M200,500 Q300,350 400,450 Q500,600 600,350 Q700,250 800,400', '#ffd700', 12),
        // Zero cross point
        circle(350, 500, 16, '#10b981', '#10b981', 0),
        circle(550, 500, 16, '#ef4444', '#ef4444', 0),
        arrow(700, 300, 780, 400, '#10b981', 10),
        text(C, 900, 'P01', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-P02-roc': {
    name: 'P02',
    label: 'ROC',
    draw() {
      return [
        line(180, 500, 840, 500, '#666', 6),
        svgPath('M200,600 Q300,550 400,480 Q500,400 550,350 Q650,300 750,280 Q800,300 820,350', '#3b82f6', 12),
        circle(500, 400, 14, '#ffd700', '#ffd700', 0),
        text(520, 380, '%', '#ffd700', 60, 'start'),
        text(C, 900, 'P02', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-P03-volume': {
    name: 'P03',
    label: '倍量',
    draw() {
      return [
        // Normal volume bars
        rect(200, 600, 50, 100, '#3b82f6', 4),
        rect(280, 620, 50, 80, '#3b82f6', 4),
        rect(360, 580, 50, 120, '#3b82f6', 4),
        // Double volume bar (highlighted)
        rect(440, 400, 50, 300, '#ef4444', 4),
        // Arrow pointing up
        arrow(465, 380, 465, 250, '#ffd700', 12),
        // Normal bars continue
        rect(530, 590, 50, 110, '#3b82f6', 4),
        rect(610, 610, 50, 90, '#3b82f6', 4),
        rect(690, 570, 50, 130, '#3b82f6', 4),
        // Price line above
        svgPath('M200,350 Q400,300 500,250 Q600,200 800,220', '#ef4444', 8),
        text(C, 900, 'P03', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-P04-engulfing': {
    name: 'P04',
    label: '反包',
    draw() {
      return [
        // Small red candle
        rect(280, 420, 60, 180, '#ef4444', 6),
        line(310, 380, 310, 420, '#ef4444', 6),
        line(310, 600, 310, 640, '#ef4444', 6),
        // Large green engulfing candle
        rect(400, 280, 100, 400, '#10b981', 8),
        line(450, 220, 450, 280, '#10b981', 6),
        line(450, 680, 450, 720, '#10b981', 6),
        // Arrow showing engulf
        svgPath('M340,500 Q380,480 400,450', '#ffd700', 8),
        arrow(400, 450, 440, 430, '#ffd700', 8),
        text(C, 900, 'P04', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-Q01-low-volume': {
    name: 'Q01',
    label: '地量',
    draw() {
      return [
        // Very small volume bars
        rect(250, 720, 40, 30, '#3b82f6', 4),
        rect(320, 710, 40, 40, '#3b82f6', 4),
        rect(390, 725, 40, 25, '#3b82f6', 4),
        rect(460, 715, 40, 35, '#3b82f6', 4),
        rect(530, 720, 40, 30, '#3b82f6', 4),
        rect(600, 730, 40, 20, '#3b82f6', 4),
        rect(670, 718, 40, 32, '#3b82f6', 4),
        // Arrow pointing up (reversal)
        arrow(700, 700, 700, 400, '#10b981', 14),
        // Price bottoming
        svgPath('M200,600 Q400,580 500,560 Q600,570 800,450', '#ef4444', 10),
        // "地" text hint
        circle(500, 750, 30, '#ffd700', 'none', 6),
        text(C, 900, 'Q01', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-Q02-high-volume': {
    name: 'Q02',
    label: '天量',
    draw() {
      return [
        // Huge volume bars
        rect(250, 300, 50, 450, '#ef4444', 4),
        rect(330, 250, 50, 500, '#ef4444', 4),
        rect(410, 200, 50, 550, '#ef4444', 4),
        rect(490, 150, 50, 600, '#ef4444', 4),
        rect(570, 280, 50, 470, '#3b82f6', 4),
        rect(650, 350, 50, 400, '#3b82f6', 4),
        // Arrow pointing down (reversal)
        arrow(500, 130, 500, 100, '#ffd700', 12),
        // Warning symbol
        text(780, 280, '!', '#ffd700', 100),
        text(C, 900, 'Q02', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-K01-ma-support': {
    name: 'K01',
    label: '支撑',
    draw() {
      return [
        // MA line
        svgPath('M200,400 Q400,380 500,400 Q600,420 820,400', '#ffd700', 10),
        // Price bouncing off MA
        svgPath('M200,350 Q350,370 450,410 Q500,400 550,370 Q650,300 800,280', '#ef4444', 10),
        // Bounce point
        circle(480, 405, 18, '#10b981', '#10b981', 0),
        arrow(480, 430, 550, 350, '#10b981', 10),
        text(C, 900, 'K01', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-K02-prev-highlow': {
    name: 'K02',
    label: '高低',
    draw() {
      return [
        // Resistance line (previous high)
        line(180, 300, 840, 300, '#ef4444', 8),
        text(860, 310, 'H', '#ef4444', 70, 'start'),
        // Support line (previous low)
        line(180, 600, 840, 600, '#10b981', 8),
        text(860, 610, 'L', '#10b981', 70, 'start'),
        // Price action
        svgPath('M200,500 Q350,450 400,320 Q450,300 500,350 Q600,450 650,580 Q700,600 750,550 Q800,450 820,350', '#fff', 8),
        text(C, 900, 'K02', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-K03-fibonacci': {
    name: 'K03',
    label: 'FIB',
    draw() {
      return [
        // Fibonacci levels
        line(180, 250, 840, 250, '#ef4444', 4),
        text(150, 260, '0%', '#ef4444', 50, 'end'),
        line(180, 350, 840, 350, '#f97316', 4),
        text(150, 360, '23.6%', '#f97316', 50, 'end'),
        line(180, 450, 840, 450, '#eab308', 4),
        text(150, 460, '38.2%', '#eab308', 50, 'end'),
        line(180, 550, 840, 550, '#22c55e', 4),
        text(150, 560, '50%', '#22c55e', 50, 'end'),
        line(180, 650, 840, 650, '#3b82f6', 4),
        text(150, 660, '61.8%', '#3b82f6', 50, 'end'),
        line(180, 750, 840, 750, '#8b5cf6', 4),
        text(150, 760, '100%', '#8b5cf6', 50, 'end'),
        // Price touching 50% level
        circle(550, 550, 16, '#ffd700', '#ffd700', 0),
        text(C, 900, 'K03', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-S01-double-bottom': {
    name: 'S01',
    label: '双底',
    draw() {
      return [
        // W shape (double bottom)
        svgPath('M200,300 Q300,350 380,650 Q420,700 500,650 Q580,600 620,650 Q700,700 780,350 Q820,300 840,280', '#ef4444', 12),
        // Neckline
        line(300, 350, 800, 350, '#ffd700', 6),
        // Breakout arrow
        arrow(780, 350, 820, 250, '#10b981', 12),
        text(C, 900, 'S01', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-S02-triangle': {
    name: 'S02',
    label: '三角',
    draw() {
      return [
        // Converging lines
        line(200, 300, 800, 550, '#ef4444', 10),
        line(200, 700, 800, 550, '#10b981', 10),
        // Price bouncing
        svgPath('M250,350 Q350,380 400,420 Q500,480 550,510 Q600,530 650,545', '#fff', 8),
        // Breakout
        arrow(700, 550, 800, 400, '#ffd700', 14),
        text(C, 900, 'S02', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-S03-head-shoulder': {
    name: 'S03',
    label: '头肩',
    draw() {
      return [
        // Head and shoulders pattern
        svgPath('M200,500 Q280,400 320,450 Q380,500 430,200 Q480,150 530,200 Q580,300 630,450 Q680,400 750,500 Q800,550 840,500', '#ef4444', 10),
        // Neckline
        line(250, 520, 800, 520, '#ffd700', 6),
        // Breakout
        arrow(800, 520, 840, 650, '#10b981', 12),
        text(C, 900, 'S03', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-S04-hammer': {
    name: 'S04',
    label: '锤子',
    draw() {
      return [
        // Hammer candlestick
        // Small body
        rect(420, 350, 100, 80, '#ef4444', 8),
        // Long lower shadow
        line(470, 430, 470, 720, '#ef4444', 8),
        // No upper shadow
        // Star/hammer head
        rect(420, 340, 100, 30, '#ffd700', 8),
        // Previous candles
        rect(250, 400, 60, 120, '#10b981', 6),
        rect(340, 380, 60, 100, '#ef4444', 6),
        // Arrow showing reversal
        arrow(570, 380, 700, 300, '#10b981', 12),
        text(C, 900, 'S04', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-D01-macd-div': {
    name: 'D01',
    label: 'MACD',
    draw() {
      return [
        // MACD histogram bars
        rect(220, 480, 30, 80, '#ef4444', 4),
        rect(280, 460, 30, 100, '#ef4444', 4),
        rect(340, 500, 30, 60, '#10b981', 4),
        rect(400, 520, 30, 40, '#10b981', 4),
        rect(460, 440, 30, 120, '#ef4444', 4),
        rect(520, 420, 30, 140, '#ef4444', 4),
        rect(580, 470, 30, 90, '#10b981', 4),
        rect(640, 490, 30, 70, '#10b981', 4),
        rect(700, 450, 30, 110, '#ef4444', 4),
        // Zero line
        line(200, 500, 820, 500, '#666', 4),
        // MACD line
        svgPath('M200,480 Q400,400 500,420 Q600,380 800,430', '#3b82f6', 8),
        // Signal line
        svgPath('M200,490 Q400,450 500,460 Q600,440 800,450', '#f97316', 8),
        text(C, 900, 'D01', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-D02-rsi-div': {
    name: 'D02',
    label: 'RSI背离',
    draw() {
      return [
        // Price making higher high
        svgPath('M200,600 Q300,500 400,400 Q500,350 600,380 Q700,320 800,300', '#ef4444', 10),
        // RSI making lower high (divergence)
        svgPath('M200,500 Q300,380 400,350 Q500,370 600,400 Q700,420 800,450', '#3b82f6', 10),
        // Divergence lines
        line(400, 400, 800, 300, '#ef4444', 4),
        line(400, 350, 800, 450, '#3b82f6', 4),
        // Divergence arrow
        text(600, 260, '背离', '#ffd700', 70),
        text(C, 900, 'D02', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-D03-cci': {
    name: 'D03',
    label: 'CCI',
    draw() {
      return [
        // +100 line
        line(180, 300, 840, 300, '#ef4444', 4),
        text(860, 310, '+100', '#ef4444', 50, 'start'),
        // -100 line
        line(180, 600, 840, 600, '#10b981', 4),
        text(860, 610, '-100', '#10b981', 50, 'start'),
        // Zero line
        line(180, 450, 840, 450, '#666', 4),
        // CCI wave
        svgPath('M200,450 Q300,300 400,200 Q450,150 500,250 Q600,500 650,700 Q700,750 750,650 Q800,500 820,400', '#ffd700', 10),
        // Extreme points
        circle(450, 150, 16, '#ef4444', '#ef4444', 0),
        circle(675, 750, 16, '#10b981', '#10b981', 0),
        text(C, 900, 'D03', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-V01-boll-squeeze': {
    name: 'V01',
    label: '收口',
    draw() {
      return [
        // Narrowing Bollinger bands
        svgPath('M200,350 Q400,380 500,420 Q600,460 820,480', '#3b82f6', 10),
        svgPath('M200,550 Q400,520 500,480 Q600,440 820,420', '#3b82f6', 10),
        // Middle line
        line(200, 450, 820, 450, '#ffd700', 6),
        // Squeeze point
        circle(500, 450, 20, '#ef4444', 'none', 8),
        // Breakout arrow
        arrow(750, 450, 850, 300, '#10b981', 14),
        text(C, 900, 'V01', '#aaa', 60),
      ].join('\n');
    }
  },
  'app-V02-atr': {
    name: 'V02',
    label: 'ATR',
    draw() {
      return [
        // ATR bars (volatility)
        rect(220, 500, 40, 200, '#3b82f6', 4),
        rect(300, 520, 40, 180, '#3b82f6', 4),
        rect(380, 540, 40, 160, '#3b82f6', 4),
        rect(460, 560, 40, 140, '#3b82f6', 4),
        rect(540, 580, 40, 120, '#3b82f6', 4),
        rect(620, 600, 40, 100, '#3b82f6', 4),
        // Narrowing range (tight consolidation)
        rect(700, 550, 40, 150, '#ef4444', 4),
        rect(780, 530, 40, 170, '#10b981', 4),
        // Arrow showing breakout
        arrow(820, 450, 860, 300, '#ffd700', 12),
        // ATR label
        text(C, 280, 'ATR', '#ffd700', 80),
        // Narrowing arrow
        arrow(300, 480, 700, 550, '#ef4444', 6),
        text(C, 900, 'V02', '#aaa', 60),
      ].join('\n');
    }
  },
};

const outputDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let count = 0;
for (const [dirName, config] of Object.entries(icons)) {
  const svgContent = svg(config.draw());
  const filePath = path.join(outputDir, `${config.name.toLowerCase()}-${config.label}.svg`);
  fs.writeFileSync(filePath, svgContent, 'utf-8');
  console.log(`Generated: ${path.basename(filePath)}`);
  count++;
}

console.log(`\nDone! Generated ${count} icons in ${outputDir}`);
