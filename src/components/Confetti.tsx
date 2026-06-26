import { useEffect, useRef } from 'react';

interface ConfettiProps {
  mode?: 'continuous' | 'burst';
  burstTrigger?: number; // Increment to trigger a new burst
}

export default function Confetti({ mode = 'continuous', burstTrigger = 0 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const colors = [
      '#fbbf24', // Gold / Yellow
      '#f59e0b', // Amber
      '#d97706', // Dark Gold
      '#ef4444', // Red
      '#3b82f6', // Blue
      '#10b981', // Green
      '#8b5cf6', // Purple
      '#ec4899', // Pink
    ];

    const createParticle = (isBurst = false) => {
      const size = Math.random() * 6 + 4;
      if (isBurst) {
        // Shoot up from bottom center
        return {
          x: width / 2 + (Math.random() * 40 - 20),
          y: height + 10,
          vx: Math.random() * 12 - 6,
          vy: -(Math.random() * 15 + 10), // Fast upward
          size,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 10 - 5,
          opacity: 1,
          shape: Math.random() > 0.5 ? 'rect' : 'circle',
        };
      } else {
        // Fall down from top
        return {
          x: Math.random() * width,
          y: Math.random() * -height - 20,
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 3 + 2,
          size,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 4 - 2,
          opacity: 1,
          shape: Math.random() > 0.5 ? 'rect' : 'circle',
        };
      }
    };

    // Initialize particles
    if (mode === 'continuous') {
      const count = 100;
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(createParticle(false));
      }
    } else {
      // Immediate burst of 80 particles
      const count = 80;
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(createParticle(true));
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Update physics
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (mode === 'burst') {
          // Add gravity
          p.vy += 0.35;
          p.vx *= 0.99; // drag
        } else {
          // Sway for continuous
          p.vx += Math.sin(p.y / 30) * 0.05;
        }

        // Render particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Recycle or remove particles
        if (mode === 'continuous') {
          if (p.y > height + 20) {
            particles[i] = createParticle(false);
            particles[i].y = -20;
          }
        } else {
          // Burst fades out
          if (p.y > height + 20 || p.opacity <= 0) {
            particles.splice(i, 1);
          } else if (p.vy > 2) {
            p.opacity -= 0.015;
          }
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [mode]);

  // Handle manual triggers
  useEffect(() => {
    if (burstTrigger > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;
      const colors = [
        '#fbbf24', '#f59e0b', '#d97706', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'
      ];
      
      const count = 50;
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 6 + 4;
        particlesRef.current.push({
          x: width / 2 + (Math.random() * 60 - 30),
          y: height + 10,
          vx: Math.random() * 14 - 7,
          vy: -(Math.random() * 16 + 12),
          size,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 12 - 6,
          opacity: 1,
          shape: Math.random() > 0.5 ? 'rect' : 'circle',
        });
      }
    }
  }, [burstTrigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    />
  );
}
