# 快速参考 - 液态背景配置

## 🎨 颜色方案速查表

| 方案名 | 英文名 | 色调 | 适用场景 | 难度 |
|--------|--------|------|---------|------|
| 科技蓝紫 | tech | 蓝→紫→紫 | 专业、现代、科技 | 容易 |
| 赛博朋克 | cyberpunk | 紫→洋红→青 | 高对比、活力、未来 | 中等 |
| 海洋蓝 | ocean | 青→蓝→深蓝 | 宁静、清爽、信任 | 容易 |
| 极光 | aurora | 绿→青→蓝→紫 | 梦幻、自然、高端 | 中等 |
| 日落 | sunset | 红→橙→紫→洋红 | 温暖、能量、创意 | 困难 |
| 森林 | forest | 绿→青→蓝 | 自然、生机、平衡 | 中等 |

## ⚡ 性能配置快速选择

### 低端设备 (≤4GB RAM, 老旧浏览器)
```javascript
<LiquidBackground 
  cellCount={5}
  speed={0.3}
  flowAmount={1}
  opacity={0.3}
  enableNetworkLines={false}
/>
```

### 标准设置 (推荐使用) ⭐
```javascript
<LiquidBackground 
  cellCount={10}
  colorScheme="tech"
  speed={0.6}
  flowAmount={2}
  opacity={0.45}
  pulseSpeed={0.018}
  enableNetworkLines={true}
  networkLineDistance={250}
/>
```

### 高端展示 (≥8GB RAM, 现代浏览器)
```javascript
<LiquidBackground 
  cellCount={15}
  speed={1}
  flowAmount={3}
  opacity={0.6}
  enableNetworkLines={true}
  networkLineDistance={350}
/>
```

## 📊 参数范围速查

| 参数 | 最小 | 推荐 | 最大 | 说明 |
|------|------|------|------|------|
| cellCount | 3 | 10 | 20 | 粒子数量，越多越密集 |
| speed | 0.1 | 0.6 | 2.0 | 运动速度，越大越快 |
| flowAmount | 0.5 | 2.0 | 4.0 | 流动幅度，越大流动越多 |
| opacity | 0.1 | 0.45 | 1.0 | 透明度，越小越透明 |
| pulseSpeed | 0.01 | 0.018 | 0.05 | 脉动速度，越小越缓慢 |
| networkLineDistance | 100 | 250 | 500 | 连线距离，越大连线越多 |

## 🎯 快速调整建议

**问题**: 背景太暗 → **解决**: 增加 `opacity` 或减少 `cellCount`
**问题**: 太卡顿 → **解决**: 减少 `cellCount`，禁用 `enableNetworkLines`
**问题**: 运动太快 → **解决**: 减少 `speed` 和 `flowAmount`
**问题**: 颜色单调 → **解决**: 改变 `colorScheme` 或增加 `cellCount`
**问题**: 连线太密集 → **解决**: 减少 `networkLineDistance`

## 🔄 动态切换颜色方案

```javascript
// 在 _app.js 中实现
const schemes = ['tech', 'cyberpunk', 'ocean', 'aurora', 'sunset', 'forest'];
const randomScheme = schemes[Math.floor(Math.random() * schemes.length)];

<LiquidBackground colorScheme={randomScheme} />
```

每次用户访问时会随机获得一个颜色方案！

## 🛠️ 常见修改

### 固定某个颜色方案
```javascript
// 改这一行
colorScheme={randomScheme}
// 为
colorScheme="sunset"  // 使用日落方案
```

### 禁用粒子连线 (提升性能)
```javascript
enableNetworkLines={false}
```

### 只保留关键参数 (简化配置)
```javascript
<LiquidBackground 
  cellCount={10}
  colorScheme="tech"
  opacity={0.45}
/>
// 其他参数使用默认值
```

### 响应式配置 (根据设备调整)
```javascript
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

<LiquidBackground 
  cellCount={isMobile ? 6 : 10}
  speed={isMobile ? 0.4 : 0.6}
  enableNetworkLines={!isMobile}
/>
```

## 📱 设备检测和自适应

```javascript
// 在 _app.js 中添加
useEffect(() => {
  const isMobile = window.innerWidth < 768;
  const cellCount = isMobile ? 6 : 10;
  const opacity = isMobile ? 0.3 : 0.45;
  // ... 使用这些值
}, []);
```

## ✅ 验证清单

- [ ] `npm run build` 成功运行
- [ ] 页面加载正常
- [ ] 背景动画流畅（60 FPS）
- [ ] 文本内容可读性良好
- [ ] 响应式布局正确

## 📚 相关文档

- 完整指南: `ADVANCED_LIQUID_BACKGROUND.md`
- 升级报告: `BACKGROUND_UPGRADE_REPORT.md`
- 源代码: `components/LiquidBackground.js`
- 应用配置: `pages/_app.js`

---

**最后更新**: 2025-12-31
**版本**: V2.0
