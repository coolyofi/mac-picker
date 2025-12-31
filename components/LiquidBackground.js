'use client';

import React, { useEffect, useRef } from 'react';

/**
 * LiquidBackground - 高级液态玻璃背景
 * 
 * 特点：
 * - 流动的圆形"细胞"（blobs）- 支持变形和网络连线
 * - 动态多色彩变化（颜色之间平滑过渡）
 * - 毛玻璃/液态效果
 * - 粒子间的网络连线效果
 * - 高性能 Canvas 实现
 * - 多种预设颜色方案
 */

class LiquidCell {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    
    // 基础属性
    this.baseRadius = config.baseRadius || (Math.random() * 80 + 40);
    this.radius = this.baseRadius;
    
    // 运动属性 - 更多自由度
    this.vx = (Math.random() - 0.5) * config.speed;
    this.vy = (Math.random() - 0.5) * config.speed;
    this.angle = Math.random() * Math.PI * 2;
    this.angularVelocity = (Math.random() - 0.5) * 0.01;
    
    // 颜色属性 - 支持多色循环
    this.hue = Math.random() * 360;
    this.saturation = config.saturation || 75;
    this.lightness = config.lightness || 55;
    this.colorIndex = 0;
    this.colorTransition = 0;
    
    // 脉动属性
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.pulseSpeed = config.pulseSpeed || 0.025;
    this.pulseAmount = config.pulseAmount || 0.35;
    
    // 噪声相位 - 产生流动感
    this.noisePhase = Math.random() * Math.PI * 2;
    this.noisePhase2 = Math.random() * Math.PI * 2;
    
    // 变形属性 - 使细胞有机流动
    this.deformPhase = Math.random() * Math.PI * 2;
    this.deformAmount = 0.15;
  }

  update(time, config, colors) {
    // 角度变化（旋转）
    this.angle += this.angularVelocity;
    
    // 使用多层噪声模拟复杂流动运动
    this.noisePhase += config.flowSpeed || 0.015;
    this.noisePhase2 += (config.flowSpeed || 0.015) * 0.7;
    
    const noiseX = Math.sin(this.noisePhase) * (config.flowAmount || 1.5);
    const noiseY = Math.cos(this.noisePhase * 0.7) * (config.flowAmount || 1.5);
    const noiseX2 = Math.sin(this.noisePhase2 * 1.3) * (config.flowAmount || 1.5) * 0.5;
    const noiseY2 = Math.cos(this.noisePhase2 * 0.9) * (config.flowAmount || 1.5) * 0.5;
    
    // 更新位置（结合基础速度和噪声）
    this.x += this.vx + (noiseX + noiseX2) * 0.3;
    this.y += this.vy + (noiseY + noiseY2) * 0.3;
    
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
    
    // 颜色循环 - 在预定义颜色之间平滑过渡
    if (colors && colors.length > 0) {
      this.colorTransition += config.colorChangeSpeed || 0.003;
      if (this.colorTransition >= 1) {
        this.colorTransition = 0;
        this.colorIndex = (this.colorIndex + 1) % colors.length;
      }
      
      const currentColor = colors[this.colorIndex];
      const nextColor = colors[(this.colorIndex + 1) % colors.length];
      
      // 颜色插值
      this.hue = currentColor + (nextColor - currentColor) * this.colorTransition;
      if (this.hue < 0) this.hue += 360;
    }
    
    // 变形相位 - 产生有机感
    this.deformPhase += 0.008;
  }

  draw(ctx, config) {
    // 创建径向渐变
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    
    // HSL 颜色
    const color = `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`;
    const colorMid = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 0.7)`;
    const colorFade = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 0.2)`;
    
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, colorMid);
    gradient.addColorStop(1, colorFade);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    // 绘制变形的圆形 - 产生有机流动感
    const segments = 32;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const deform = Math.sin(this.deformPhase + angle * 3) * this.deformAmount;
      const x = this.x + Math.cos(angle) * this.radius * (1 + deform);
      const y = this.y + Math.sin(angle) * this.radius * (1 + deform);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.fill();
  }
}

const LiquidBackground = ({
  cellCount = 8,
  colorScheme = 'tech',
  speed = 1,
  flowAmount = 2,
  opacity = 0.5,
  pulseSpeed = 0.02,
  enableNetworkLines = true,
  networkLineDistance = 200,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const cellsRef = useRef([]);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  // 颜色预设 - 多种色彩方案
  const colorSchemes = {
    tech: { 
      name: '科技蓝紫',
      hues: [240, 260, 280, 300, 320],
      saturation: 75,
      lightness: 55,
    },
    cyberpunk: { 
      name: '赛博朋克',
      hues: [280, 320, 180, 140, 220],
      saturation: 85,
      lightness: 50,
    },
    ocean: { 
      name: '海洋蓝',
      hues: [200, 220, 240, 260, 180],
      saturation: 70,
      lightness: 50,
    },
    aurora: { 
      name: '极光绿紫',
      hues: [120, 160, 200, 280, 320],
      saturation: 75,
      lightness: 55,
    },
    sunset: {
      name: '日落橙粉',
      hues: [20, 50, 280, 320, 350],
      saturation: 80,
      lightness: 55,
    },
    forest: {
      name: '森林绿蓝',
      hues: [100, 140, 180, 220, 260],
      saturation: 70,
      lightness: 50,
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
        baseRadius: Math.random() * 100 + 60,
        speed: speed * 0.4,
        saturation: config.saturation,
        lightness: config.lightness,
        pulseSpeed,
        pulseAmount: 0.3,
      })
    );

    // 绘制粒子间的连线
    const drawNetworkLines = (cells) => {
      if (!enableNetworkLines) return;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const dx = cells[i].x - cells[j].x;
          const dy = cells[i].y - cells[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < networkLineDistance) {
            // 根据距离计算透明度 - 越近越不透明
            const opacity = 1 - (distance / networkLineDistance);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.12})`;
            
            ctx.beginPath();
            ctx.moveTo(cells[i].x, cells[i].y);
            ctx.lineTo(cells[j].x, cells[j].y);
            ctx.stroke();
          }
        }
      }
    };

    // 动画循环
    const animate = () => {
      timeRef.current += 1;

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 设置混合模式（液态效果）
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = opacity;

      // 更新并绘制所有细胞
      cellsRef.current.forEach((cell) => {
        cell.update(timeRef.current, {
          flowSpeed: 0.012,
          flowAmount: flowAmount * 0.15,
          colorChangeSpeed: 0.004,
        }, config.hues);

        cell.draw(ctx, {});
      });

      // 重置混合模式，绘制网络线
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      drawNetworkLines(cellsRef.current);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [cellCount, colorScheme, speed, flowAmount, opacity, pulseSpeed, enableNetworkLines, networkLineDistance]);

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
