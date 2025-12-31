'use client';

import React, { useEffect, useRef } from 'react';

/**
 * LiquidBackgroundAdvanced - 使用 Three.js 的高级液态背景
 * 
 * 这是一个升级版本，提供更复杂的着色器效果和更好的视觉质量
 * 需要安装：npm install three
 * 
 * 使用方法：
 * import LiquidBackgroundAdvanced from '@/components/LiquidBackgroundAdvanced';
 * 
 * <LiquidBackgroundAdvanced colorScheme="tech" />
 */

const LiquidBackgroundAdvanced = ({
  colorScheme = 'tech',
  turbulence = 2.0,
  flowSpeed = 0.5,
  opacity = 0.8,
  className = ''
}) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const materialRef = useRef(null);

  useEffect(() => {
    // 动态导入 Three.js（为了减少初始包大小）
    const initThreeScene = async () => {
      try {
        const THREE = await import('three');

        const container = containerRef.current;
        if (!container) return;

        // 场景设置
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.OrthographicCamera(
          window.innerWidth / -2,
          window.innerWidth / 2,
          window.innerHeight / 2,
          window.innerHeight / -2,
          0.1,
          1000
        );
        camera.position.z = 1;

        const renderer = new THREE.WebGLRenderer({ 
          alpha: true, 
          antialias: true,
          powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 颜色方案
        const colorSchemes = {
          tech: {
            color1: [0.486, 0.361, 1.0],     // 紫色
            color2: [0.0, 0.816, 1.0],       // 青色
            color3: [0.227, 1.0, 0.078],     // 绿色
          },
          cyberpunk: {
            color1: [1.0, 0.0, 1.0],
            color2: [0.0, 1.0, 1.0],
            color3: [1.0, 1.0, 0.0],
          },
          ocean: {
            color1: [0.1, 0.141, 0.49],
            color2: [0.31, 0.765, 0.968],
            color3: [0.502, 0.871, 0.918],
          },
        };

        const colors = colorSchemes[colorScheme] || colorSchemes.tech;

        // 着色器代码
        const vertexShader = `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `;

        const fragmentShader = `
          uniform float time;
          uniform vec2 resolution;
          uniform float turbulence;
          uniform float flowSpeed;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform vec3 color3;
          varying vec2 vUv;

          // 简单的 Perlin 风格噪声（基于三角函数的近似）
          float noise(vec2 p) {
            return sin(p.x * 12.9898 + p.y * 78.233) * 43758.5453;
          }

          float smoothNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            
            float n00 = noise(i);
            float n10 = noise(i + vec2(1.0, 0.0));
            float n01 = noise(i + vec2(0.0, 1.0));
            float n11 = noise(i + vec2(1.0, 1.0));
            
            float nx0 = mix(n00, n10, f.x);
            float nx1 = mix(n01, n11, f.x);
            return mix(nx0, nx1, f.y);
          }

          // 分形布朗运动
          float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            
            for(int i = 0; i < 4; i++) {
              value += amplitude * smoothNoise(p * frequency);
              amplitude *= 0.5;
              frequency *= 2.0;
            }
            return value;
          }

          void main() {
            vec2 uv = vUv;
            
            // 时间变化
            float t = time * flowSpeed * 0.1;
            
            // 多层噪声产生液态流动
            vec2 offset1 = vec2(fbm(uv + vec2(t, 0.0)), fbm(uv + vec2(0.0, t)));
            vec2 offset2 = vec2(fbm(uv + offset1), fbm(uv + offset1 + vec2(t * 0.5)));
            
            // 计算最终 UV
            vec2 finalUv = uv + offset1 * 0.15 + offset2 * 0.1;
            finalUv *= turbulence * 0.5;
            
            // 多个噪声函数的组合
            float n1 = fbm(finalUv + vec2(t * 0.3));
            float n2 = fbm(finalUv + vec2(t * 0.2) + 10.0);
            float n3 = fbm(finalUv - vec2(t * 0.1) + 20.0);
            
            // 颜色混合
            vec3 color = mix(color1, color2, sin(n1 * 3.14159) * 0.5 + 0.5);
            color = mix(color, color3, sin(n2 * 3.14159) * 0.5 + 0.5);
            
            // 透明度基于噪声
            float alpha = (n1 + n2 + n3) / 3.0 * 0.8;
            
            gl_FragColor = vec4(color, alpha);
          }
        `;

        // 创建材质
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            time: { value: 0 },
            resolution: { value: [window.innerWidth, window.innerHeight] },
            turbulence: { value: turbulence },
            flowSpeed: { value: flowSpeed },
            color1: { value: new THREE.Vector3(...colors.color1) },
            color2: { value: new THREE.Vector3(...colors.color2) },
            color3: { value: new THREE.Vector3(...colors.color3) },
          },
          transparent: true,
          side: THREE.DoubleSide,
        });
        materialRef.current = material;

        // 创建全屏平面
        const geometry = new THREE.PlaneGeometry(
          window.innerWidth,
          window.innerHeight
        );
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // 处理窗口调整大小
        const handleResize = () => {
          const width = window.innerWidth;
          const height = window.innerHeight;
          
          camera.left = width / -2;
          camera.right = width / 2;
          camera.top = height / 2;
          camera.bottom = height / -2;
          camera.updateProjectionMatrix();
          
          renderer.setSize(width, height);
          
          if (material.uniforms.resolution) {
            material.uniforms.resolution.value = [width, height];
          }
        };

        window.addEventListener('resize', handleResize);

        // 动画循环
        let time = 0;
        const animate = () => {
          time += 0.016; // 约 60fps
          
          if (material.uniforms.time) {
            material.uniforms.time.value = time;
          }
          
          renderer.render(scene, camera);
          requestAnimationFrame(animate);
        };

        animate();

        return () => {
          window.removeEventListener('resize', handleResize);
          renderer.dispose();
          geometry.dispose();
          material.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        };
      } catch (error) {
        console.warn('Three.js not available, falling back to Canvas version', error);
      }
    };

    initThreeScene();
  }, [colorScheme, turbulence, flowSpeed, opacity]);

  return (
    <div
      ref={containerRef}
      className={`liquid-bg-advanced ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
};

export default LiquidBackgroundAdvanced;
