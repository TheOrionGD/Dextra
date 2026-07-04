import React, { useEffect, useRef } from 'react';

/**
 * SectionParticles Component
 * 
 * Renders a high-performance, full-viewport interactive background particle canvas.
 * Customized style details:
 *  - Larger, thicker particles (radius 3.0px to 5.5px, opacity 0.5 to 0.8)
 *  - Clear, elegant indigo-purple constellation connection lines (thickness 1.2px)
 *  - Dynamic mouse attraction/repulsion interaction
 *  - Retina/High-DPI support
 */
export default function SectionParticles({ particleCount = 45 }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let particles = [];
    let animationFrameId;
    let isVisible = false;
    let isMobileDevice = window.innerWidth < 768;

    // Track active viewport dimensions
    let logicalWidth = window.innerWidth;
    let logicalHeight = window.innerHeight;

    // Generate particles with customized properties (larger size & higher thickness/opacity)
    const createParticles = (width, height) => {
      const activeCount = isMobileDevice ? Math.min(particleCount, 15) : particleCount;
      particles = Array.from({ length: activeCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.5 + 3.0, // Larger size: 3.0px to 5.5px
        vx: (Math.random() * 0.3 - 0.15), // Slow, graceful drift
        vy: -(Math.random() * 0.25 + 0.15), // Drift upwards
        opacity: Math.random() * 0.3 + 0.5, // Higher opacity for "thicker" look (0.5 to 0.8)
        color: Math.random() > 0.5
          ? '112, 125, 244' // Beautiful Indigo-Purple matching the reference webdesign
          : Math.random() > 0.25 
            ? '90, 158, 214' // Deep Sea Blue
            : '140, 192, 235' // Skylight Blue
      }));
    };

    // Keep canvas crisp on High-DPI screens and fit to viewport
    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      isMobileDevice = window.innerWidth < 768;
      logicalWidth = parent.clientWidth;
      logicalHeight = parent.clientHeight;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      createParticles(logicalWidth, logicalHeight);
    };

    const ctx = canvas.getContext('2d');

    // Main animation loop
    const animate = () => {
      if (!isVisible) return;

      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // 1. Update Positions and Draw Particles
      particles.forEach((p) => {
        // Mouse Repulsion Physics (Desktop Only)
        if (mouseRef.current.active && !isMobileDevice) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.hypot(dx, dy);
          const repelRadius = 140; // Area of mouse influence

          if (dist < repelRadius) {
            const force = (repelRadius - dist) / repelRadius;
            const angle = Math.atan2(dy, dx);
            p.x += Math.cos(angle) * force * 1.5;
            p.y += Math.sin(angle) * force * 1.5;
          }
        }

        // Apply normal drift
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around borders seamlessly
        if (p.x < -10) p.x = logicalWidth + 10;
        if (p.x > logicalWidth + 10) p.x = -10;
        if (p.y < -10) p.y = logicalHeight + 10;
        if (p.y > logicalHeight + 10) p.y = -10;

        // Draw particle circles with ambient glow shadows
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.shadowColor = `rgba(${p.color}, 0.35)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset blur for lines
      });

      // 2. Draw Constellation Connection Lines (Desktop Only)
      if (!isMobileDevice && particles.length > 0) {
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];

          // Particle-to-Particle connections (thicker & more visible)
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.hypot(dx, dy);
            const maxConnectionDist = 120;

            if (dist < maxConnectionDist) {
              const opacity = (1 - dist / maxConnectionDist) * 0.28; // Thicker opacity (up to 0.28)
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(112, 125, 244, ${opacity})`; // Indigo connection lines
              ctx.lineWidth = 1.2; // Thicker lines
              ctx.stroke();
            }
          }

          // Particle-to-Mouse connections (draws links to cursor)
          if (mouseRef.current.active) {
            const dx = p1.x - mouseRef.current.x;
            const dy = p1.y - mouseRef.current.y;
            const dist = Math.hypot(dx, dy);
            const maxMouseDist = 160;

            if (dist < maxMouseDist) {
              const opacity = (1 - dist / maxMouseDist) * 0.38; // Rich mouse link opacity
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
              ctx.strokeStyle = `rgba(112, 125, 244, ${opacity})`; // Sleek indigo interactive link
              ctx.lineWidth = 1.4; // Thicker interactive lines
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Track Mouse Cursor coordinates
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleMouseEnter = () => {
      mouseRef.current.active = true;
    };

    // IntersectionObserver to pause the render loop when sections are offscreen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            cancelAnimationFrame(animationFrameId); // Avoid duplication
            animate();
          } else {
            cancelAnimationFrame(animationFrameId);
          }
        });
      },
      { threshold: 0.01 }
    );

    observer.observe(canvas);
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ top: 0, left: 0 }}
    />
  );
}
