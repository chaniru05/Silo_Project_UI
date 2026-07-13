import React, { useRef, useEffect } from 'react';
import { Silo } from '../types';

interface SiloShaderProps {
  silo: Silo;
  isLarge?: boolean;
}

export const SiloShader: React.FC<SiloShaderProps> = ({ silo, isLarge = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let waveOffset = 0;
    
    // Grains stream particles
    interface Particle {
      x: number;
      y: number;
      vy: number;
      size: number;
      opacity: number;
    }
    const particles: Particle[] = [];

    const draw = () => {
      if (!canvas || !ctx) return;
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Silo geometry dimensions
      const paddingX = width * 0.15;
      const topY = height * 0.12;
      const coneStartY = height * 0.72;
      const bottomY = height * 0.88;
      const siloWidth = width - paddingX * 2;
      const siloHeight = coneStartY - topY;

      // Calculate current fill level height
      // 0% is at coneStartY (or bottomY depending on visualization, let's treat cone as part of volume)
      const fillPercentDecimal = Math.max(0, Math.min(100, silo.fillPercent)) / 100;
      const totalSiloDrawHeight = bottomY - topY;
      const fillHeightPixels = totalSiloDrawHeight * fillPercentDecimal;
      
      const currentFillY = bottomY - fillHeightPixels;

      // 1. Draw outer structural container (Backing)
      ctx.fillStyle = '#0a0d11';
      ctx.beginPath();
      ctx.moveTo(paddingX, topY);
      ctx.lineTo(width - paddingX, topY);
      ctx.lineTo(width - paddingX, coneStartY);
      ctx.lineTo(width / 2 + 3, bottomY);
      ctx.lineTo(width / 2 - 3, bottomY);
      ctx.lineTo(paddingX, coneStartY);
      ctx.closePath();
      ctx.fill();

      // Background grid lines inside the silo
      ctx.strokeStyle = 'rgba(37, 44, 53, 0.4)';
      ctx.lineWidth = 1;
      for (let y = topY + 15; y < coneStartY; y += 15) {
        ctx.beginPath();
        ctx.moveTo(paddingX, y);
        ctx.lineTo(width - paddingX, y);
        ctx.stroke();
      }

      // Draw active fill content (Feed/Grains)
      if (silo.fillPercent > 0 && silo.status !== 'sensor_err') {
        // Set color scheme based on status
        let mainColor = 'rgba(245, 166, 35, 0.65)'; // Amber/Gold default
        let peakColor = '#ffc880';
        let coreColor = 'rgba(245, 166, 35, 0.4)';

        if (silo.status === 'warning') {
          mainColor = 'rgba(239, 68, 68, 0.65)'; // Red alarm
          peakColor = '#fca5a5';
          coreColor = 'rgba(239, 68, 68, 0.4)';
        } else if (silo.status === 'critical') {
          mainColor = 'rgba(239, 68, 68, 0.7)';
          peakColor = '#fca5a5';
          coreColor = 'rgba(239, 68, 68, 0.45)';
        } else if (silo.status === 'filling') {
          mainColor = 'rgba(245, 166, 35, 0.7)';
          peakColor = '#ffe3b3';
          coreColor = 'rgba(245, 166, 35, 0.5)';
        }

        ctx.save();
        
        // Define clipping path for the silo interior content
        ctx.beginPath();
        ctx.moveTo(paddingX + 1, topY + 1);
        ctx.lineTo(width - paddingX - 1, topY + 1);
        ctx.lineTo(width - paddingX - 1, coneStartY);
        ctx.lineTo(width / 2 + 2, bottomY - 1);
        ctx.lineTo(width / 2 - 2, bottomY - 1);
        ctx.lineTo(paddingX + 1, coneStartY);
        ctx.closePath();
        ctx.clip();

        // Create volumetric linear gradient
        const fillGrad = ctx.createLinearGradient(paddingX, topY, width - paddingX, topY);
        fillGrad.addColorStop(0, mainColor);
        fillGrad.addColorStop(0.3, coreColor);
        fillGrad.addColorStop(0.7, coreColor);
        fillGrad.addColorStop(1, mainColor);

        // Draw fill body
        ctx.fillStyle = fillGrad;
        ctx.beginPath();

        // Animate wave on surface of feed
        waveOffset += (silo.status === 'filling' || silo.status === 'unloading') ? 0.08 : 0.02;
        
        // Surface line with sinus waves
        const waveAmp = (silo.status === 'filling' || silo.status === 'unloading') ? 3 : 1;
        const waveFreq = 0.08;
        
        ctx.moveTo(paddingX - 5, currentFillY);
        for (let x = paddingX; x <= width - paddingX; x += 2) {
          const waveY = currentFillY + Math.sin((x + waveOffset * 20) * waveFreq) * waveAmp;
          ctx.lineTo(x, waveY);
        }

        // Connect down to fill the bottom cone and base
        ctx.lineTo(width - paddingX, bottomY);
        ctx.lineTo(paddingX, bottomY);
        ctx.closePath();
        ctx.fill();

        // Wave surface highlight (glowing peak line)
        ctx.strokeStyle = peakColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(paddingX, currentFillY);
        for (let x = paddingX; x <= width - paddingX; x += 2) {
          const waveY = currentFillY + Math.sin((x + waveOffset * 20) * waveFreq) * waveAmp;
          ctx.lineTo(x, waveY);
        }
        ctx.stroke();

        // Volumetric lighting overlays (shadow at the bottom)
        const shadowGrad = ctx.createLinearGradient(width / 2, currentFillY, width / 2, bottomY);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
        shadowGrad.addColorStop(0.8, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.moveTo(paddingX, currentFillY);
        ctx.lineTo(width - paddingX, currentFillY);
        ctx.lineTo(width - paddingX, bottomY);
        ctx.lineTo(paddingX, bottomY);
        ctx.closePath();
        ctx.fill();

        // Draw floating micro-grain elements
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        for (let i = 0; i < (isLarge ? 25 : 10); i++) {
          const grainX = paddingX + (Math.sin(i * 4.2 + waveOffset * 0.1) * 0.5 + 0.5) * siloWidth;
          const grainY = currentFillY + ((Math.cos(i * 1.7 + waveOffset * 0.05) * 0.5 + 0.5) * (bottomY - currentFillY));
          if (grainY < bottomY && grainY > currentFillY) {
            ctx.fillRect(grainX, grainY, 1.5, 1.5);
          }
        }

        ctx.restore();
      }

      // 2. Draw Filling particles stream (if state is 'filling')
      if (silo.status === 'filling' && silo.flowRate > 0) {
        // Spawn particle
        if (Math.random() < 0.6) {
          particles.push({
            x: width / 2 + (Math.random() - 0.5) * 6,
            y: topY,
            vy: 4 + Math.random() * 3,
            size: 1 + Math.random() * 2,
            opacity: 1
          });
        }

        ctx.fillStyle = 'rgba(255, 200, 128, 0.85)';
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.y += p.vy;
          
          // Render particle
          ctx.fillRect(p.x, p.y, p.size, p.size);
          
          // Splash if reaches surface
          if (p.y >= currentFillY) {
            // Draw splash ripple
            ctx.fillStyle = 'rgba(255, 227, 179, 0.6)';
            ctx.beginPath();
            ctx.ellipse(p.x, currentFillY, p.size * 2, p.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            particles.splice(i, 1);
          } else if (p.y > bottomY) {
            particles.splice(i, 1);
          }
        }

        // Solid stream core
        const streamGrad = ctx.createLinearGradient(width / 2 - 3, topY, width / 2 + 3, currentFillY);
        streamGrad.addColorStop(0, 'rgba(255, 200, 128, 0.9)');
        streamGrad.addColorStop(1, 'rgba(245, 166, 35, 0.6)');
        ctx.fillStyle = streamGrad;
        ctx.fillRect(width / 2 - 2, topY, 4, Math.max(0, currentFillY - topY));
      }

      // 3. Draw Unloading particles draining (if state is 'unloading')
      if (silo.status === 'unloading' && silo.flowRate < 0) {
        if (Math.random() < 0.4) {
          particles.push({
            x: width / 2 + (Math.random() - 0.5) * 4,
            y: bottomY - 5,
            vy: 3 + Math.random() * 2,
            size: 1.2,
            opacity: 1
          });
        }

        ctx.fillStyle = 'rgba(245, 166, 35, 0.7)';
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.y += p.vy;
          ctx.fillRect(p.x, p.y, p.size, p.size);
          if (p.y > height) {
            particles.splice(i, 1);
          }
        }
      }

      // 4. Draw outer structural shell (Metal casing)
      ctx.strokeStyle = '#3a4454';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(paddingX, topY);
      ctx.lineTo(width - paddingX, topY);
      ctx.lineTo(width - paddingX, coneStartY);
      ctx.lineTo(width / 2 + 3, bottomY);
      ctx.lineTo(width / 2 - 3, bottomY);
      ctx.lineTo(paddingX, coneStartY);
      ctx.closePath();
      ctx.stroke();

      // Roof cap (conical top)
      ctx.fillStyle = '#1e242d';
      ctx.strokeStyle = '#3a4454';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(paddingX - 4, topY);
      ctx.lineTo(width / 2, topY - 12);
      ctx.lineTo(width - paddingX + 4, topY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw Top inlet valve flange
      ctx.fillStyle = '#3a4454';
      ctx.fillRect(width / 2 - 5, topY - 16, 10, 4);

      // Support legs structure
      ctx.strokeStyle = '#2b3442';
      ctx.lineWidth = 2;
      // Left leg
      ctx.beginPath();
      ctx.moveTo(paddingX + 2, coneStartY);
      ctx.lineTo(paddingX - 4, height);
      ctx.stroke();
      // Right leg
      ctx.beginPath();
      ctx.moveTo(width - paddingX - 2, coneStartY);
      ctx.lineTo(width - paddingX + 4, height);
      ctx.stroke();
      // Leg braces
      ctx.strokeStyle = '#1e242d';
      ctx.beginPath();
      ctx.moveTo(paddingX - 4, height * 0.95);
      ctx.lineTo(width - paddingX + 4, height * 0.95);
      ctx.stroke();

      // 5. Draw dynamic glow markers or warning brackets
      if (silo.status === 'warning') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(width / 2, currentFillY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (silo.status === 'critical') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        // Draw alarm brackets
        ctx.strokeRect(paddingX - 6, currentFillY - 6, siloWidth + 12, 12);
      }

      // Draw sensor err overlay (Comms offline offline pattern)
      if (silo.status === 'sensor_err') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(paddingX, topY, siloWidth, siloHeight);
        
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(paddingX, topY);
        ctx.lineTo(width - paddingX, coneStartY);
        ctx.moveTo(width - paddingX, topY);
        ctx.lineTo(paddingX, coneStartY);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('OFFLINE', width / 2, (topY + coneStartY) / 2);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [silo, isLarge]);

  return (
    <div className="relative flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={isLarge ? 140 : 80}
        height={isLarge ? 280 : 160}
        className="drop-shadow-[0_0_15px_rgba(0,0,0,0.6)]"
      />
      <div className="mt-2 text-center">
        <span className="font-mono text-[10px] text-gray-500 block leading-none">
          {silo.id}
        </span>
        <span className="font-sans text-xs font-semibold text-gray-200 mt-0.5 truncate max-w-[100px] block">
          {silo.type}
        </span>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className={`w-1.5 h-1.5 rounded-full ${
            silo.status === 'filling' ? 'bg-amber-400 animate-pulse' :
            silo.status === 'unloading' ? 'bg-amber-500 animate-pulse' :
            silo.status === 'warning' ? 'bg-red-400 animate-ping' :
            silo.status === 'critical' ? 'bg-red-500 animate-pulse' :
            silo.status === 'sensor_err' ? 'bg-gray-600' : 'bg-emerald-500'
          }`} />
          <span className="font-mono text-[10px] text-gray-400">
            {silo.status === 'sensor_err' ? 'ERR' : `${silo.fillPercent}%`}
          </span>
        </div>
      </div>
    </div>
  );
};
