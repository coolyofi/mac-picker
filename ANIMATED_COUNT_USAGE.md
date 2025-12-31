# AnimatedCount 组件使用指南

## 概述
改进后的 `AnimatedCount` 组件提供了平滑的数字动画效果，支持多种动画风格、格式化显示和性能优化。

## 基础用法

### 简单计数（默认翻转效果）
```jsx
import AnimatedCount from '@/components/AnimatedCount';

export default function Demo() {
  const [count, setCount] = useState(0);
  
  return <AnimatedCount value={count} />;
}
```

## 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | number | 必需 | 要显示的数值 |
| `className` | string | `''` | 额外的 CSS 类名 |
| `variant` | string | `'flip'` | 动画效果变体：`flip` \| `slide` \| `fade` \| `bounce` |
| `format` | function | `null` | 格式化函数，用于自定义数字显示 |
| `duration` | number | `0.18` | 动画持续时间（秒） |
| `monospace` | boolean | `true` | 是否使用等宽字体（防止布局抖动） |

## 使用示例

### 1. 翻转效果（3D 翻转）
```jsx
<AnimatedCount 
  value={count}
  variant="flip"
  duration={0.2}
/>
```
**效果**：数字以 3D 翻转效果变化，流畅自然。

### 2. 滑动效果（上下滑动）
```jsx
<AnimatedCount 
  value={count}
  variant="slide"
  duration={0.18}
/>
```
**效果**：数字从下方滑入，上方滑出。

### 3. 渐变效果（淡入淡出）
```jsx
<AnimatedCount 
  value={count}
  variant="fade"
  duration={0.12}
/>
```
**效果**：数字平稳淡入淡出，效率最高。

### 4. 弹跳效果（缩放弹跳）
```jsx
<AnimatedCount 
  value={count}
  variant="bounce"
  duration={0.25}
/>
```
**效果**：数字以弹跳缩放方式出现。

## 格式化显示

### 货币格式
```jsx
<AnimatedCount 
  value={19999}
  format={(n) => `¥${n.toLocaleString()}`}
/>
```
输出：`¥19,999`

### 百分比格式
```jsx
<AnimatedCount 
  value={85}
  format={(n) => `${n}%`}
/>
```
输出：`85%`

### 数据存储格式（GB/TB）
```jsx
<AnimatedCount 
  value={1024}
  format={(n) => {
    if (n >= 1024) return `${(n / 1024).toFixed(1)}TB`;
    return `${n}GB`;
  }}
/>
```
输出：`1.0TB`

### 千位分隔符
```jsx
<AnimatedCount 
  value={1500000}
  format={(n) => n.toLocaleString()}
/>
```
输出：`1,500,000`

## 性能优化特性

### 1. 硬件加速
- 使用 `will-change: transform, opacity` 提示浏览器进行硬件加速
- 3D 变换启用 GPU 加速

### 2. 等宽数字显示
- 使用 `font-variant-numeric: tabular-nums` 确保数字宽度相同
- 避免数字变化时页面布局抖动（layout shift）

### 3. 最小化 DOM 操作
- 使用 `AnimatePresence mode="wait"` 避免不必要的重排
- 每个值使用唯一的 `key` 确保正确的动画过渡

### 4. 背面隐藏
- `backface-visibility: hidden` 防止翻转时的闪烁
- `-webkit-font-smoothing: antialiased` 提升文字渲染质量

## 实战场景

### 购物车商品数量计数
```jsx
<AnimatedCount 
  value={cartCount}
  variant="bounce"
  duration={0.2}
  className="badge"
/>
```

### 产品价格显示
```jsx
<AnimatedCount 
  value={price}
  format={(n) => `$${(n / 100).toFixed(2)}`}
  variant="fade"
  monospace={true}
  className="price-tag"
/>
```

### 库存数量
```jsx
<AnimatedCount 
  value={inventory}
  variant="slide"
  format={(n) => `${n}件库存`}
  className="stock-indicator"
/>
```

### 评分/评价数
```jsx
<AnimatedCount 
  value={reviews}
  format={(n) => {
    if (n > 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  }}
  variant="flip"
  className="review-count"
/>
```

## CSS 类名参考

- `.count-roll` - 容器元素
- `.count-roll--{variant}` - 动画变体类（flip/slide/fade/bounce）
- `.count-roll--monospace` - 等宽字体模式
- `.count-roll__value` - 数值元素

## 性能建议

1. **对于实时更新频繁的场景**，使用 `fade` 或 `slide` 效果（更轻量）
2. **对于关键指标**，使用 `flip` 效果（视觉冲击强）
3. **设置合理的 `duration`**：太快（<0.12s）显示不清；太慢（>0.3s）显示过度
4. **始终启用 `monospace`**：防止数字宽度变化导致的布局抖动

## 浏览器兼容性

- ✅ Chrome/Edge 88+
- ✅ Firefox 87+
- ✅ Safari 14+
- ✅ 所有现代移动浏览器

3D 翻转效果需要 `transform-style: preserve-3d` 支持（所有现代浏览器都支持）。

## 示例整合

在 ProductCard 或其他组件中使用：

```jsx
import AnimatedCount from '@/components/AnimatedCount';

export default function ProductCard({ product, count }) {
  return (
    <div className="product-card">
      <div className="price">
        <AnimatedCount 
          value={product.price}
          format={(n) => `¥${n.toLocaleString()}`}
          variant="flip"
          duration={0.2}
        />
      </div>
      <div className="stock-badge">
        <AnimatedCount 
          value={count}
          variant="bounce"
          className="stock-count"
        />
      </div>
    </div>
  );
}
```

---

**更新时间**：2025-12-31
**版本**：2.0 - 添加动画变体、格式化和性能优化
