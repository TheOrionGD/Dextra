import React, { useEffect, useRef } from 'react';

/**
 * SectionParticles Component
 * 
 * Renders a full-size absolute canvas that populates floating background particles.
 * Uses IntersectionObserver to start/stop the animation loop to ensure high performance
 * when sections are scrolled out of view.
 */
export default function SectionParticles({ particleCount = 25 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    let animationFrameId;
    let isVisible = false;

    // Create particles relative to canvas size
    const createParticles = () => {
      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.8,
        speedY: -(Math.random() * 0.35 + 0.1), // Drift upwards
        speedX: (Math.random() * 0.25 - 0.125), // Drift slightly sideways
        opacity: Math.random() * 0.3 + 0.05,
        color: Math.random() > 0.6 
          ? '140, 192, 235' // Sea Blue
          : Math.random() > 0.3 
            ? '191, 221, 240' // Sky Blue
            : '255, 235, 204' // Peach Glow
      }));
    };

    // Draw and animate particles
    const animate = () => {
      if (!isVisible) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        // Reset positions when particles drift off edges
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0 || p.x > canvas.width) {
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.shadowColor = `rgba(${p.color}, 0.4)`;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Keep canvas size responsive to parent section sizing
    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      createParticles();
    };

    // Pause/Resume loop depending on visibility
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            animate();
          } else {
            cancelAnimationFrame(animationFrameId);
          }
        });
      },
      { threshold: 0.02 } // Trigger as soon as 2% of the section is visible
    );

    observer.observe(canvas);
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 mix-blend-multiply opacity-60"
      style={{ top: 0, left: 0 }}
    />
  );
}
