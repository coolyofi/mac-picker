'use client';

import React, { useEffect, useRef } from 'react';

/**
 * LiquidBackground - 动态液态玻璃背景
 * 
 * 特点：
 * - 流动的圆形"细胞"（blobs）
 * - 动态颜色变化（HSL色相循环）
 * - 毛玻璃/液态效果
 * - 高性能 Canvas 实现
 */

class LiquidCell {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    
    // 基础属性
    this.baseRadius = config.baseRadius || (Math.random() * 80 + 40);
    this.radius = this.baseRadius;
    
    // 运动属性
    this.vx = (Math.random() - 0.5) * config.speed;
    this.vy = (Math.random() - 0.5) * config.speed;
    this.angle = Math.random() * Math.PI * 2;
    this.angularVelocity = (Math.random() - 0.5) * 0.01;
    
    // 颜色属性
    this.hue = Math.random() * 360;
    this.saturation = config.saturation || 70;
    this.lightness = config.lightness || 50;
    
    // 脉动属性
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.pulseSpeed = config.pulseSpeed || 0.02;
    this.pulseAmount = config.pulseAmount || 0.3;
    
    // 噪声相位（用于更自然的运动）
    this.noisePhase = Math.random() * Math.PI * 2;
  }

  update(time, config) {
    // 角度变化（旋转）
    this.angle += this.angularVelocity;
    
    // 使用三角函数模拟流动运动
    this.noisePhase += config.flowSpeed || 0.01;
    const noiseX = Math.sin(this.noisePhase) * config.flowAmount || 0.5;
    const noiseY = Math.cos(this.noisePhase * 0.7) * config.flowAmount || 0.5;
    
    // 更新位置
    this.x += this.vx + noiseX;
    this.y += this.vy + noiseY;
    
    // 边界反弹
    if (this.x - this.baseRadius < 0 || this.x + this.baseRadius > this.canvas.width) {
      this.vx *= -1;
      this.x = Math.max(this.baseRadius, Math.min(this.canvas.width - this.baseRadius, this.x));
    }
    if (this.y - this.baseRadius < 0 || this.y + this.baseRadius > this.canvas.height) {
      this.vy *= -1;
      this.y = Math.max(this.baseRadius, Math.min(this.canvas.height - this.baseRadius, this.y));
    }
    
    // 脉动效果
    this.pulsePhase += this.pulseSpeed;
    const pulseFactor = 1 + Math.sin(this.pulsePhase) * this.pulseAmount;
    this.radius = this.baseRadius * pulseFactor;
    
    // 颜色变化（色相旋转）
    this.hue = (this.hue + (config.hueShiftSpeed || 0.1)) % 360;
  }

  draw(ctx, config) {
    // 创建径向渐变
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    
    // HSL 颜色
    const color = `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`;
    const colorDark = `hsl(${this.hue}, ${this.saturation}%, ${this.lightness - 30}%)`;
    
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.6, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 0.5)`);
    gradient.addColorStop(1, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
      this.x - this.radius,
      this.y - this.radius,
      this.radius * 2,
      this.radius * 2
    );
  }
}

const LiquidBackground = ({
  cellCount = 6,
  colorScheme = 'tech',
  speed = 0.8,
  flowAmount = 2,
  opacity = 0.7,
  hueShiftSpeed = 0.5,
  pulseSpeed = 0.02,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const cellsRef = useRef([]);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  // 颜色预设
  const colorSchemes = {
    tech: { // 科技蓝紫
      hues: [240, 280, 320],
      baseHue: 260,
    },
    cyberpunk: { // 赛博朋克粉青
      hues: [280, 180, 340],
      baseHue: 280,
    },
    ocean: { // 海洋蓝
      hues: [200, 220, 240],
      baseHue: 210,
    },
    aurora: { // 极光绿紫
      hues: [120, 280, 200],
      baseHue: 240,
    },
  };

  const config = colorSchemes[colorScheme] || colorSchemes.tech;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置 canvas 尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化细胞
    cellsRef.current = Array.from({ length: cellCount }, () => 
      new LiquidCell(canvas, {
        baseRadius: Math.random() * 80 + 50,
        speed: speed * 0.3,
        saturation: 70,
        lightness: 50,
        pulseSpeed,
        pulseAmount: 0.2,
      })
    );

    // 动画循环
    const animate = () => {
      timeRef.current += 1;

      // 清空画布（完全清空，然后重新绘制）
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 设置混合模式（液态效果）
      ctx.globalCompositeOperation = 'lighter'; // 或 'screen'
      ctx.globalAlpha = opacity;

      // 更新并绘制所有细胞
      cellsRef.current.forEach((cell, idx) => {
        // 分配不同的基础色相
        const baseHue = (config.baseHue + idx * (360 / cellCount)) % 360;
        cell.hue = (baseHue + timeRef.current * hueShiftSpeed * 0.1) % 360;

        cell.update(timeRef.current, {
          flowSpeed: 0.008,
          flowAmount: flowAmount * 0.1,
          hueShiftSpeed: hueShiftSpeed * 0.001,
        });

        cell.draw(ctx, {});
      });

      // 重置状态
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [cellCount, colorScheme, speed, flowAmount, opacity, hueShiftSpeed, pulseSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className={`liquid-bg ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default LiquidBackground;
