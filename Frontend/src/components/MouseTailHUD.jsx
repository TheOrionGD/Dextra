import React, { useEffect, useRef, useState } from 'react';

/**
 * MouseTailHUD Component (Desktop Only)
 * 
 * Renders a highly responsive, canvas-drawn, spring-physics mouse tail
 * that trails directly behind the standard browser mouse pointer.
 */
export default function MouseTailHUD() {
  const canvasRef = useRef(null);

  // Track state in refs for latency-free reads in requestAnimationFrame loop
  const rawMouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const pointsRef = useRef(
    Array.from({ length: 45 }, () => ({ x: 0, y: 0, vx: 0, vy: 0 }))
  );

  const isHoveringRef = useRef(false);
  const isVisibleRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const animationFrameRef = useRef(null);

  // Component states
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile screens to disable the cursor HUD
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    if (window.innerWidth < 768) {
      return () => {
        window.removeEventListener('resize', checkMobile);
      };
    }

    // 1. Initialise Canvas Dimensions
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 2. Track Mouse Movement and Hover States
    const handleMouseMove = (e) => {
      const mx = e.clientX;
      const my = e.clientY;
      rawMouseRef.current = { x: mx, y: my };

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
      }

      // Snap the tail to the cursor immediately on first entry to prevent stretching lines
      if (!hasInitializedRef.current) {
        const points = pointsRef.current;
        points.forEach((p) => {
          p.x = mx;
          p.y = my;
          p.vx = 0;
          p.vy = 0;
        });
        hasInitializedRef.current = true;
      }

      // Check if mouse is hovering over interactive elements
      const target = e.target;
      if (target) {
        const isInteractive = !!target.closest(
          'a, button, input, select, textarea, [role="button"], .cursor-pointer, .btn'
        );
        isHoveringRef.current = isInteractive;
      }
    };

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
      hasInitializedRef.current = false; // Reset initialisation so it snaps back next time
    };

    const handleMouseEnter = () => {
      isVisibleRef.current = true;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // 3. Animation Loop (60fps/120fps physics update and canvas draw)
    const loop = () => {
      const mx = rawMouseRef.current.x;
      const my = rawMouseRef.current.y;

      const points = pointsRef.current;
      const canvas = canvasRef.current;

      if (canvas && points.length > 0) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));

        if (isVisibleRef.current && hasInitializedRef.current) {
          // Head of the tail attaches exactly to the browser mouse pointer coordinate (mx, my)
          points[0].x += (mx - points[0].x) * 0.45;
          points[0].y += (my - points[0].y) * 0.45;

          // Cascading spring physics for trailing points
          for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];

            const dx = prev.x - curr.x;
            const dy = prev.y - curr.y;

            // Spring constants tailored for the smooth, wave-like, organic movement
            const stiffness = 0.38;
            const damping = 0.54;

            curr.vx += dx * stiffness;
            curr.vy += dy * stiffness;
            curr.vx *= damping;
            curr.vy *= damping;

            curr.x += curr.vx;
            curr.y += curr.vy;
          }

          // Draw the smooth bezier line
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';

          // Glow shadow effect (stronger shadow glow when hovering over buttons)
          ctx.shadowBlur = isHoveringRef.current ? 18 : 11;
          ctx.shadowColor = 'rgba(92, 19, 128, 0.17)'; // lightning blue glow

          for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);

            // Compute midpoint for quadratic bezier interpolation
            const xc = (p1.x + p2.x) / 2;
            const yc = (p1.y + p2.y) / 2;
            ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);

            const ratio = i / (points.length - 1);

            // Fades from thick (14.0px) down to thin (0.5px)
            ctx.lineWidth = 14.0 * (1 - ratio);

            // Lightning blue (0, 229, 255) color fading opacity along the tail
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.95 * (1 - ratio)})`;
            ctx.stroke();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();

    // 4. Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[9999] mix-blend-screen"
      style={{ pointerEvents: 'none' }}
    />
  );
}
