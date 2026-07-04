import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Terminal, 
  Shield, 
  Zap, 
  Cpu, 
  Layers, 
  Play, 
  Mail, 
  Volume2, 
  Video, 
  Sliders, 
  Download, 
  ChevronRight, 
  CheckCircle,
  Eye,
  SlidersHorizontal,
  Code
} from 'lucide-react';

import Section3DWelcome from './Section3DWelcome';

const TOTAL_FRAMES = 51;
// Pre-generate image URLs from /frames/frame_001.jpg to frame_051.jpg
const frameUrls = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const frameNum = String(i + 1).padStart(3, '0');
  return `/frames/frame_${frameNum}.jpg`;
});

export default function Landing() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const particleCanvasRef = useRef(null);
  
  // Loading states
  const [images, setImages] = useState([]);
  const [imagesProgress, setImagesProgress] = useState(0);
  const [modelProgress, setModelProgress] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState('gestures');

  // Mouse positions for interactive glows (with Spring physics)
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const springMouseX = useSpring(0, { damping: 40, stiffness: 200 });
  const springMouseY = useSpring(0, { damping: 40, stiffness: 200 });
  const lastDrawnIndex = useRef(0);

  // Scroll Tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smooth scroll progression (eliminates seek jank)
  const smoothProgress = useSpring(scrollYProgress, {
    damping: 35,
    stiffness: 120,
    mass: 0.6
  });

  // Check if mobile or small screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Preload Images (updates imagesProgress)
  useEffect(() => {
    if (isMobile) {
      setIsLoading(false);
      return;
    }

    let loadedCount = 0;
    const loadedImages = [];

    frameUrls.forEach((url, index) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        setImagesProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
        loadedImages[index] = img;

        if (loadedCount === TOTAL_FRAMES) {
          setImages(loadedImages);
        }
      };
      img.onerror = () => {
        loadedCount++;
        setImagesProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
        if (loadedCount === TOTAL_FRAMES) {
          setImages(loadedImages);
        }
      };
    });
  }, [isMobile]);

  // Combined progress coordinator (coordinates loading both 2D frames and 3D model)
  useEffect(() => {
    if (isMobile) return;
    const combined = Math.round((imagesProgress + modelProgress) / 2);
    setLoadingProgress(combined);
    if (imagesProgress === 100 && modelProgress === 100) {
      setTimeout(() => {
        setIsLoading(false);
      }, 850);
    }
  }, [imagesProgress, modelProgress, isMobile]);

  // Track Mouse movement for glow overlay
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.current = e.clientX;
      mouseY.current = e.clientY;
      springMouseX.set(e.clientX);
      springMouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [springMouseX, springMouseY]);

  // Canvas Frame seeking
  useEffect(() => {
    if (isLoading || isMobile || images.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;

    const render = () => {
      const progress = smoothProgress.get();
      // Map progress to current frame index (0 to 50)
      let frameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1))));
      let img = images[frameIndex];

      // Fallback to last successfully rendered frame to prevent flashes/breaks
      if (!img) {
        frameIndex = lastDrawnIndex.current;
        img = images[frameIndex];
      }

      if (img && ctx) {
        lastDrawnIndex.current = frameIndex;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Aspect ratio cover calculations
        const imgWidth = img.width;
        const imgHeight = img.height;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const imgRatio = imgWidth / imgHeight;
        const canvasRatio = canvasWidth / canvasHeight;

        let dWidth, dHeight, dx, dy;

        if (canvasRatio > imgRatio) {
          dWidth = canvasWidth;
          dHeight = canvasWidth / imgRatio;
          dx = 0;
          dy = (canvasHeight - dHeight) / 2;
        } else {
          dWidth = canvasHeight * imgRatio;
          dHeight = canvasHeight;
          dx = (canvasWidth - dWidth) / 2;
          dy = 0;
        }

        // Apply scroll-driven slow dolly zoom (dolly-in effect)
        const zoom = 1.0 + (progress * 0.12);
        
        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
        
        // Enable high-quality image smoothing to prevent pixelation/breaks on scroll scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, dx, dy, dWidth, dHeight);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoading, isMobile, images, smoothProgress]);

  // Secondary canvas for custom floating particles
  useEffect(() => {
    if (isLoading) return;

    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    const particleCount = isMobile ? 15 : 45;
    let animationFrameId;

    const createParticles = () => {
      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        speedY: -(Math.random() * 0.4 + 0.1),
        speedX: (Math.random() * 0.3 - 0.15),
        opacity: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.5 ? '140, 192, 235' : '191, 221, 240' // Accent primary / secondary rgb
      }));
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        // Reset if drifted off top or sides
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0 || p.x > canvas.width) {
          p.x = Math.random() * canvas.width;
        }

        // Draw particle with soft glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.shadowColor = `rgba(${p.color}, 0.5)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationFrameId = requestAnimationFrame(animateParticles);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles();
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    animateParticles();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoading, isMobile]);

  // Framer Motion transforms for text segments based on scroll progress
  // Section 1: Intro (0% to 20%)
  const s1Opacity = useTransform(smoothProgress, [0, 0.15, 0.20], [1, 1, 0]);
  const s1Y = useTransform(smoothProgress, [0, 0.15, 0.20], [0, -20, -60]);
  const s1Scale = useTransform(smoothProgress, [0, 0.18], [1, 0.96]);

  // Section 2: Contactless Control (20% to 40%)
  const s2Opacity = useTransform(smoothProgress, [0.17, 0.22, 0.35, 0.40], [0, 1, 1, 0]);
  const s2Y = useTransform(smoothProgress, [0.17, 0.22, 0.35, 0.40], [40, 0, 0, -40]);

  // Section 3: Scroll Through Intelligence (40% to 65%)
  const s3Opacity = useTransform(smoothProgress, [0.38, 0.44, 0.58, 0.64], [0, 1, 1, 0]);
  const s3Y = useTransform(smoothProgress, [0.38, 0.44, 0.58, 0.64], [40, 0, 0, -40]);

  // Section 4: System Architecture Cards (65% to 85%)
  const s4Opacity = useTransform(smoothProgress, [0.62, 0.68, 0.80, 0.85], [0, 1, 1, 0]);
  const s4Y = useTransform(smoothProgress, [0.62, 0.68, 0.80, 0.85], [40, 0, 0, -40]);

  // Section 5: Final CTA Sequence (85% to 100%)
  const s5Opacity = useTransform(smoothProgress, [0.82, 0.88, 0.98], [0, 1, 1]);
  const s5Y = useTransform(smoothProgress, [0.82, 0.88, 0.98], [40, 0, 0]);
  const s5Scale = useTransform(smoothProgress, [0.85, 0.95], [0.97, 1]);

  return (
    <div className="relative min-h-screen bg-transparent font-sans overflow-x-clip selection:bg-[#8CC0EB]/30 selection:text-[#2c3e50]">
      
      {/* ── LOADER OVERLAY ── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-primary)]"
          >
            <div className="relative flex flex-col items-center max-w-md px-6 text-center">
              
              {/* Spinner Wrapper */}
              <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                {/* Outer spinning ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="w-full h-full rounded-full border-2 border-t-[#8CC0EB] border-r-transparent border-b-transparent border-l-transparent absolute inset-0"
                />
                
                {/* Bouncing brand logo centered inside the spinner */}
                <motion.div 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  className="w-12 h-12 flex items-center justify-center z-10"
                >
                  <img 
                    src="/dextra-icon.png" 
                    alt="DEXTRA" 
                    className="w-10 h-10 object-contain filter drop-shadow-[0_4px_12px_rgba(140,192,235,0.55)]" 
                  />
                </motion.div>
              </div>
              
              <h2 className="mt-8 text-2xl font-bold tracking-tight text-slate-800 font-heading">
                DEXTRA
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500 tracking-widest uppercase">
                Initializing Intelligence
              </p>
              
              {/* Progress Bar Container */}
              <div className="w-64 h-[3px] bg-slate-200/60 rounded-full overflow-hidden mt-6">
                <motion.div 
                  className="h-full bg-[#8CC0EB] shadow-[0_0_12px_#8CC0EB]"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              
              <span className="mt-3 text-xs font-mono text-[#546e8a] tabular-nums">
                {loadingProgress}% loaded
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SCROLL PROGRESS STRIP ── */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#8CC0EB] via-[#BFDDF0] to-[#5A9ED6] origin-left z-[101]"
        style={{ scaleX: scrollYProgress }}
      />

      {/* ── NOISE OVERLAY FOR ANALOG TEXTURE ── */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[95] bg-[url('data:image/svg+xml;utf8,<svg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22><filter id=%22noiseFilter%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%%25%22 height=%22100%%25%22 filter=%22url(%23noiseFilter)%22/></svg>')]" />

      {/* ── LENS FLARE CINEMATIC EFFECT ── */}
      <motion.div 
        className="fixed -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-radial from-[#BFDDF0]/35 via-transparent to-transparent pointer-events-none z-[2]"
        style={{
          y: useTransform(scrollYProgress, [0, 1], [-50, 150]),
          scale: useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.2, 0.8])
        }}
      />

      {/* 3D Asset Overlay (Desktop only, fixed across entire landing page/system) */}
      {!isMobile && (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-[8]">
          <Section3DWelcome 
            smoothProgress={smoothProgress}
            onLoadProgress={setModelProgress}
            onLoaded={() => setModelProgress(100)}
          />
        </div>
      )}

      {/* ── MAIN SCROLLYTELLING CONTAINER ── */}
      <div ref={containerRef} className="relative h-[510vh] w-full bg-transparent">
        
        {/* Sticky Viewport */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
          
          {/* Background Canvas Frame Renderer */}
          {!isMobile ? (
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 w-full h-full object-cover z-0" 
            />
          ) : (
            /* Mobile Fallback: Elegant visual rendering instead of image sequence */
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FFF9D2] via-[#FFEBCC] to-[#BFDDF0] flex items-center justify-center z-0">
              <div className="w-[300px] h-[300px] rounded-full bg-white/40 blur-3xl" />
              <div className="absolute w-[80vw] h-[40vh] border border-white/20 rounded-3xl bg-white/10 backdrop-blur-2xl shadow-2xl flex items-center justify-center">
                <span className="text-9xl filter drop-shadow-[0_10px_30px_rgba(140,192,235,0.7)]">🤚</span>
              </div>
            </div>
          )}


          {/* Drifting Floating Particles Canvas */}
          <canvas 
            ref={particleCanvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none z-[15]"
          />

          {/* Mouse Follow Glow Overlay (Desktop only) */}
          {!isMobile && (
            <motion.div 
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] bg-[#8CC0EB]/20 w-[450px] h-[450px] z-[12]"
              style={{ x: springMouseX, y: springMouseY }}
            />
          )}

          {/* Soft Editorial Fog & Light Gradient Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 249, 210, 0.05) 0%, rgba(255, 235, 204, 0.12) 60%, rgba(191, 221, 240, 0.25) 100%)'
            }}
          />

          {/* Left-to-Right Soft Gradient to create a high-contrast text pocket on the left */}
          <div 
            className="absolute inset-y-0 left-0 w-full md:w-[60vw] pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to right, rgba(255, 249, 210, 0.90) 0%, rgba(255, 249, 210, 0.70) 50%, rgba(255, 249, 210, 0.35) 75%, transparent 100%)'
            }}
          />

          {/* ──────────────────────────────────────────────────────── */}
          {/* SECTION 1: HERO OVERLAY (0% - 20%) */}
          {/* ──────────────────────────────────────────────────────── */}
          <motion.div 
            style={{ opacity: s1Opacity, y: s1Y, scale: s1Scale }}
            className="absolute inset-y-0 left-0 w-full md:w-[50vw] flex flex-col justify-center text-left pl-12 md:pl-24 lg:pl-32 pr-6 z-20"
          >
            <div className="max-w-2xl flex flex-col items-start text-left">
              {/* Premium Top Badge */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#8CC0EB]/40 bg-white/60 backdrop-blur-md shadow-sm mb-6"
              >
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8CC0EB] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8CC0EB]"></span>
                </span>
                <span className="text-xs font-bold text-[#546e8a] uppercase tracking-wider">
                  DEXTRA OS CONTROLLER • v1.0
                </span>
              </motion.div>

              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-800 font-heading leading-[1.08] mb-6 drop-shadow-sm select-none">
                Engineer Intelligence.<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-[#5A9ED6] to-[#8CC0EB] drop-shadow-sm">
                  Innovate. Build. Impact.
                </span>
              </h1>
              
              <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-10 select-none">
                Control your digital interface using natural, contact-free hand gestures and voice triggers. Powered by offline AI.
              </p>

              {/* CMD PALETTE BADGE / SHORTCUT CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={() => navigate('/app')}
                  className="px-8 py-4 rounded-full text-base font-bold text-white bg-slate-800 hover:bg-slate-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </button>
                
                <div 
                  onClick={() => {
                    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' });
                    window.dispatchEvent(event);
                  }}
                  className="px-6 py-4 rounded-full border border-slate-300/40 bg-white/60 hover:bg-white/90 backdrop-blur-md text-sm font-semibold text-slate-700 shadow-sm flex items-center justify-center gap-3 cursor-pointer hover:border-[#8CC0EB]/50 transition-all select-none"
                  title="Try command shortcut"
                >
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-slate-100 border border-slate-300/60 rounded text-xs text-slate-500 font-mono shadow-sm">Ctrl</kbd>
                    <span className="text-slate-400 font-normal">+</span>
                    <kbd className="px-2 py-1 bg-slate-100 border border-slate-300/60 rounded text-xs text-slate-500 font-mono shadow-sm">K</kbd>
                  </span>
                  <span className="text-slate-600 font-medium border-l border-slate-300/60 pl-3">Command Menu</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* GLOBAL SCROLL INDICATOR */}
          <motion.div 
            style={{
              opacity: useTransform(smoothProgress, [0, 0.12], [0.75, 0]),
              y: useTransform(smoothProgress, [0, 0.12], [0, -15])
            }}
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 cursor-pointer z-25 pointer-events-none"
          >
            <span className="text-xs font-extrabold text-[#dc143c] uppercase tracking-widest">Scroll to seek</span>
            <div className="w-6 h-10 rounded-full border-2 border-[#dc143c]/60 flex items-start justify-center p-1.5">
              <div className="w-1.5 h-2 bg-[#dc143c] rounded-full animate-bounce" />
            </div>
          </motion.div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* SECTION 2: CONTROL WITHOUT CONTACT (20% - 40%) */}
          {/* ──────────────────────────────────────────────────────── */}
          <motion.div 
            style={{ opacity: s2Opacity, y: s2Y }}
            className="absolute inset-y-0 left-0 w-full md:w-[55vw] flex flex-col justify-center text-left pl-12 md:pl-24 lg:pl-32 pr-6 z-20"
          >
            <div className="max-w-2xl flex flex-col items-start">
              <span className="text-xs font-bold text-[#5A9ED6] uppercase tracking-widest bg-[#BFDDF0]/45 px-3.5 py-1.5 rounded-full mb-4 inline-block">
                Gesture-First Workspace
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-800 font-heading mb-6">
                Control Without Contact
              </h2>
              <p className="text-base text-slate-600 leading-relaxed mb-10">
                Interact with your environment cleanly and dynamically. Standard webcams translate hand positions into precise cursor movements and hotkeys instantly.
              </p>

              {/* Floating Badges Group */}
              <div className="flex flex-wrap justify-start gap-3.5 max-w-xl">
                {[
                  { icon: "🧠", text: "MediaPipe Tracking" },
                  { icon: "⚡", text: "Zero Latency Processing" },
                  { icon: "🎙️", text: "Offline Speech Commands" },
                  { icon: "🛠️", text: "Custom Actions Editor" },
                  { icon: "🔒", text: "100% Local Execution" },
                  { icon: "💻", text: "Low Resource Overhead" }
                ].map((badge, idx) => (
                  <motion.div
                    key={badge.text}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/70 backdrop-blur-md border border-[#8CC0EB]/20 shadow-sm text-sm font-semibold text-slate-700 hover:bg-white/90 hover:scale-102 hover:border-[#8CC0EB]/40 transition-all select-none"
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* SECTION 3: SCROLL THROUGH INTELLIGENCE (40% - 65%) */}
          {/* ──────────────────────────────────────────────────────── */}
          <motion.div 
            style={{ opacity: s3Opacity, y: s3Y }}
            className="absolute inset-y-0 left-0 w-full md:w-[55vw] flex flex-col justify-center text-left pl-12 md:pl-24 lg:pl-32 pr-6 z-20"
          >
            <div className="max-w-2xl flex flex-col items-start">
              <span className="text-xs font-bold text-[#5A9ED6] uppercase tracking-widest bg-[#BFDDF0]/40 px-3.5 py-1.5 rounded-full mb-5 inline-block">
                Scrollytelling Engine
              </span>
              
              {/* Staggered Word Reveal Heading */}
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-800 font-heading mb-8">
                {["Scroll", "Through", "Intelligence"].map((word, i) => (
                  <motion.span 
                    key={i} 
                    className="inline-block mr-3 bg-clip-text text-transparent bg-gradient-to-b from-slate-800 to-slate-700"
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.25, duration: 0.5, ease: "easeOut" }}
                  >
                    {word}
                  </motion.span>
                ))}
              </h2>

              <p className="text-base text-slate-600 leading-relaxed drop-shadow-sm select-none">
                Every frame reveals a deeper layer of intelligence—vision, reasoning, orchestration, and seamless execution. The gesture video adapts directly to the speed of your fingers.
              </p>
            </div>
          </motion.div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* SECTION 4: BUILT FOR THE FUTURE CARDS (65% - 85%) */}
          {/* ──────────────────────────────────────────────────────── */}
          <motion.div 
            style={{ opacity: s4Opacity, y: s4Y }}
            className="absolute inset-y-0 left-0 w-full md:w-[65vw] flex flex-col justify-center text-left pl-12 md:pl-24 lg:pl-32 pr-6 z-20"
          >
            <div className="max-w-3xl">
              <span className="text-xs font-bold text-[#5A9ED6] uppercase tracking-widest bg-[#BFDDF0]/40 px-3.5 py-1.5 rounded-full mb-4 inline-block">
                Core Engineering
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-800 font-heading mb-4">
                Built For Real-World Operations
              </h2>
              <p className="text-sm md:text-base text-slate-600 mb-8 leading-relaxed">
                A system designed to sit in the system tray, consuming minimal resources while enabling infinite customization.
              </p>

              {/* Architecture Timeline UI instead of cards */}
              <div className="relative pl-6 border-l border-[#8CC0EB]/40 space-y-6 max-w-2xl mt-8">
                {[
                  {
                    num: "01",
                    icon: <Shield className="w-4 h-4 text-[#5A9ED6]" />,
                    title: "Security first",
                    desc: "All video frames and audio remain processed locally. Absolutely zero camera streams or audio data are uploaded."
                  },
                  {
                    num: "02",
                    icon: <Cpu className="w-4 h-4 text-[#5A9ED6]" />,
                    title: "Scalability",
                    desc: "Super optimized landmarks pipeline runs smoothly on standard laptop CPUs without throttling."
                  },
                  {
                    num: "03",
                    icon: <Sliders className="w-4 h-4 text-[#5A9ED6]" />,
                    title: "Automation",
                    desc: "Direct OS API integrations. Execute macros, launch applications, or trigger Python scripts via gestures."
                  },
                  {
                    num: "04",
                    icon: <Layers className="w-4 h-4 text-[#5A9ED6]" />,
                    title: "Integration",
                    desc: "Websocket server binds to external services, letting you control smart devices or third-party web apps."
                  }
                ].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.12, duration: 0.45 }}
                    className="relative group flex items-start gap-4"
                  >
                    {/* Glowing circular node on the timeline path */}
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[#8CC0EB] bg-white group-hover:bg-[#8CC0EB] group-hover:shadow-[0_0_8px_rgba(140,192,235,0.7)] transition-all duration-300 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                    </div>

                    <div className="flex gap-3">
                      <span className="font-mono text-lg font-bold text-[#5A9ED6]/80 tracking-tighter shrink-0 select-none">
                        {item.num}
                      </span>
                      <div className="p-1 rounded-lg bg-[#BFDDF0]/30 text-[#5A9ED6] shrink-0 mt-0.5">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-1 font-heading group-hover:text-[#5A9ED6] transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* SECTION 5: FINAL CTA SEQUENCE (85% - 100%) */}
          {/* ──────────────────────────────────────────────────────── */}
          <motion.div 
            style={{ opacity: s5Opacity, y: s5Y, scale: s5Scale }}
            className="absolute inset-y-0 left-0 w-full md:w-[50vw] flex flex-col justify-center text-left pl-12 md:pl-24 lg:pl-32 pr-6 z-20"
          >
            <div className="max-w-2xl flex flex-col items-start">
              <span className="text-xs font-bold text-[#5A9ED6] uppercase tracking-widest bg-[#BFDDF0]/40 px-3.5 py-1.5 rounded-full mb-5 inline-block">
                Start Touchless Controls
              </span>
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-800 font-heading mb-6 leading-tight">
                Empower Your Interface.<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-[#5A9ED6] to-[#8CC0EB]">
                  Experience DEXTRA.
                </span>
              </h2>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-10">
                Unlock a hands-free desktop workflow configuration setup in less than two minutes.
              </p>

              {/* Three CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={() => navigate('/app')}
                  className="px-8 py-4 rounded-full text-base font-bold text-white bg-slate-800 hover:bg-slate-700 shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </button>
                
                <a
                  href="#setup"
                  className="px-7 py-4 rounded-full text-base font-semibold text-[#1a2e42] bg-[#BFDDF0] hover:bg-[#8CC0EB] border border-[#8CC0EB]/20 backdrop-blur-md shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Terminal className="w-5 h-5 text-slate-600" /> Watch Setup
                </a>

                <button
                  onClick={() => {
                    const target = document.getElementById('features');
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-7 py-4 rounded-full text-base font-semibold text-slate-600 hover:text-slate-850 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  View Features
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* NEXT CONTENT SECTION: DETAILS & FEATURES */}
      {/* ──────────────────────────────────────────────────────── */}
      {/* ── LOWER CONTENT AREA WRAPPER ── */}
      <div className="relative w-full overflow-hidden bg-transparent z-30 border-t border-[#8CC0EB]/20">
        {/* Ambient Pulsing Glow Blobs */}
        <div className="absolute top-[10%] right-[-150px] w-[500px] h-[500px] bg-[#8CC0EB]/8 rounded-full blur-[130px] pointer-events-none z-0" />
        <div className="absolute top-[40%] left-[-200px] w-[600px] h-[600px] bg-[#FFEBCC]/12 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="absolute bottom-[10%] right-[-100px] w-[550px] h-[550px] bg-[#BFDDF0]/10 rounded-full blur-[120px] pointer-events-none z-0" />
        
        {/* Dot Matrix Blueprint Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#8ca0eb_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-[0.035] pointer-events-none z-0" />

        <section id="features" className="relative w-full py-28 px-6 bg-transparent z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-bold text-[#5A9ED6] uppercase tracking-widest bg-[#BFDDF0]/40 px-3.5 py-1.5 rounded-full mb-4 inline-block">
              Interactive Dashboard Overview
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-800 font-heading mb-6">
              Complete Control Dashboard
            </h2>
            <p className="text-base text-slate-500 leading-relaxed">
              DEXTRA is packed with features designed to build the ultimate customizable touchless OS workflow.
            </p>
          </div>

          {/* Interactive Feature Demo Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-20">
            {/* Nav tabs for demonstration */}
            <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
              {[
                {
                  id: 'gestures',
                  title: 'Gestures Library',
                  icon: <Video className="w-5 h-5 text-[#5A9ED6]" />,
                  desc: 'Configure standard hand markers, coordinate grids, and action mapping.'
                },
                {
                  id: 'speech',
                  title: 'Speech Command Engine',
                  icon: <Volume2 className="w-5 h-5 text-[#5A9ED6]" />,
                  desc: 'Bind offline voice instructions (Whisper tiny) to automated triggers.'
                },
                {
                  id: 'custom',
                  title: 'Custom Gesture Trainer',
                  icon: <SlidersHorizontal className="w-5 h-5 text-[#5A9ED6]" />,
                  desc: 'Record a custom hand sign via your webcam and train live AI models.'
                }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDemoTab(tab.id)}
                  className={`p-5 rounded-2xl text-left border transition-all duration-300 flex items-start gap-4 ${
                    activeDemoTab === tab.id
                      ? 'border-[#8CC0EB] bg-[#BFDDF0]/25 shadow-md shadow-[#8CC0EB]/10'
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${
                    activeDemoTab === tab.id ? 'bg-[#8CC0EB]/35' : 'bg-slate-200/50'
                  } transition-colors`}>
                    {tab.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1 font-heading">{tab.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{tab.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Visualizer Panel details */}
            <div className="lg:col-span-8 p-8 rounded-3xl bg-[#FFEBCC]/35 border border-[#8CC0EB]/20 shadow-md backdrop-blur-sm min-h-[360px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">
                    Live Preview Engine
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  {activeDemoTab === 'gestures' && (
                    <motion.div
                      key="gestures"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="w-full"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-7 space-y-4 text-left">
                          <h4 className="text-lg font-bold text-slate-800 font-heading">
                            Interactive Gesture Coordinate Grid
                          </h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            Tracks 21 distinct hand landmarks in real-time. Calculate relative distance formulas between finger tips to trigger primary and secondary clicks, dragging operations, or scrolling logic.
                          </p>
                          
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                              <span className="text-xs font-bold text-[#5A9ED6] block mb-1">Index Up Gesture</span>
                              <span className="text-xs text-slate-400">Maps to cursor translation movement with smoothing filter</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                              <span className="text-xs font-bold text-[#5A9ED6] block mb-1">Pinch Sign Gesture</span>
                              <span className="text-xs text-slate-400">Fast action map: Triggers immediate left-mouse click events</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive HUD visualizer column */}
                        <div className="md:col-span-5 flex items-center justify-center pointer-events-none select-none">
                          <div className="relative w-44 h-44 flex items-center justify-center">
                            {/* Pulse background target */}
                            <div className="absolute inset-0 rounded-full border border-[#8CC0EB]/20 bg-[#8CC0EB]/5 animate-ping duration-[3.6s] z-0" />
                            
                            <motion.img 
                              src="/gesture_target_tracker.png" 
                              alt="Gesture Tracker HUD" 
                              className="w-40 h-40 object-contain filter drop-shadow-[0_0_15px_rgba(140,192,235,0.45)] relative z-10"
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeDemoTab === 'speech' && (
                    <motion.div
                      key="speech"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <h4 className="text-lg font-bold text-slate-800 font-heading">
                        Offline Speech Processing Daemon
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Features an embedded Whisper speech recognizer that listens to customizable commands locally. Toggle voice listening modes using gesture pins to ensure secure hotkey bindings.
                      </p>

                      <div className="mt-4 p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs space-y-2 border border-slate-800">
                        <p className="text-slate-500">// Terminal voice engine monitoring</p>
                        <p><span className="text-green-400">[INFO]</span> Speech Daemon loaded successfully (Whisper-Tiny-en)</p>
                        <p><span className="text-blue-400">[LISTENING]</span> Wait-Word target: "Hey Dextra"</p>
                        <p><span className="text-cyan-400">[COMMAND]</span> "Open Terminal" detected → Executing: <span className="text-yellow-400">PowerShell -NoExit</span></p>
                      </div>
                    </motion.div>
                  )}

                  {activeDemoTab === 'custom' && (
                    <motion.div
                      key="custom"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <h4 className="text-lg font-bold text-slate-800 font-heading">
                        Custom AI Gestures Training Suite
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Create custom shortcuts in seconds. Record a signature hand gesture directly via your webcam, assign it a system hotkey, and export it instantly.
                      </p>

                      <div className="flex gap-4 items-center mt-4">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-2xl font-bold">
                          +
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-700 block">Record Gesture Set</span>
                          <span className="text-xs text-slate-400">Requires 30 frames sample size to complete training sequence</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-200/60 pt-4">
                <span className="text-xs text-slate-500 font-medium">Fully open-source, runs natively on Windows & macOS.</span>
                <button 
                  onClick={() => navigate('/app')}
                  className="flex items-center gap-1.5 text-sm font-bold text-[#5A9ED6] hover:text-[#8CC0EB] transition-colors"
                >
                  Explore Dashboard <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* INTERACTIVE GESTURES QUICK LIST CHEAT SHEET */}
      {/* ──────────────────────────────────────────────────────── */}
      <section id="gestures" className="relative w-full py-24 px-6 bg-transparent z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-xs font-bold text-[#5A9ED6] uppercase tracking-widest bg-[#BFDDF0]/40 px-3.5 py-1.5 rounded-full mb-4 inline-block">
                Standard Action Set
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-800 font-heading">
                Gesture Registry
              </h2>
            </div>
            <p className="text-sm md:text-base text-slate-500 max-w-md leading-relaxed">
              Standard pre-mapped gestures optimized for daily operations. Check, rebind, or disable configurations anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: "☝️", name: "Index Finger Up", action: "Move Mouse Pointer", details: "Tracks absolute screen coordinates with inertial smoothing filter." },
              { emoji: "🤏", name: "Finger Pinch", action: "Trigger Left Click", details: "Detects proximity threshold between thumb tip and index tip." },
              { emoji: "🖕", name: "Middle + Thumb Proximity", action: "Trigger Right Click", details: "Immediate context menu trigger." },
              { emoji: "✌️", name: "Two Fingers Up", action: "Vertical Scrolling", details: "Move hand vertically to navigate websites and documents." },
              { emoji: "✊", name: "Closed Fist", action: "Minimize Window", details: "Closes or minimizes current focus pane." },
              { emoji: "👋", name: "Wrist Flick Right", action: "Browser Forward", details: "Easy lateral flick to skip forward in history." }
            ].map((gesture, i) => (
              <div 
                key={gesture.name}
                className="p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md hover:border-[#8CC0EB]/40 hover:-translate-y-0.5 transition-all duration-300 flex items-start gap-5"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#FFEBCC]/45 flex items-center justify-center text-3xl shadow-inner shrink-0">
                  {gesture.emoji}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-1 font-heading flex items-center gap-1.5">
                    {gesture.name}
                  </h3>
                  <span className="inline-block text-xs font-semibold text-[#5A9ED6] bg-[#BFDDF0]/20 px-2.5 py-0.5 rounded-full mb-3">
                    {gesture.action}
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {gesture.details}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={() => navigate('/app/gestures')}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#1a2e42] bg-[#BFDDF0] hover:bg-[#8CC0EB] px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              See All Gestures <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* LOCAL QUICK SETUP GUIDE */}
      {/* ──────────────────────────────────────────────────────── */}
      <section id="setup" className="relative w-full py-24 px-6 bg-transparent z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-[#5A9ED6] uppercase tracking-widest bg-[#BFDDF0]/40 px-3.5 py-1.5 rounded-full inline-block">
                Developer Deployment
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-800 font-heading">
                Launch System in Seconds
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Setting up DEXTRA on your system requires Python 3.9+ and dependencies. Download, initialize, and immediately control your viewport.
              </p>

              <div className="space-y-4">
                {[
                  "100% locally compiled, no internet connection required",
                  "Integrates natively with Windows OS keypress simulations",
                  "Includes terminal interface daemon script"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-semibold text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Code className="w-48 h-48 text-white" />
              </div>
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                  PowerShell Terminal Installation
                </span>
                <span className="text-xs font-mono text-emerald-400">● Live Connection Status</span>
              </div>

              <div className="font-mono text-xs md:text-sm text-slate-300 space-y-4">
                <div>
                  <span className="text-slate-500"># 1. Clone repository and navigate to folder</span>
                  <p className="text-cyan-400 mt-1">git clone https://github.com/Orion/dextra.git</p>
                  <p className="text-cyan-400">cd dextra</p>
                </div>

                <div>
                  <span className="text-slate-500"># 2. Install required tracking packages</span>
                  <p className="text-cyan-400 mt-1">pip install -r requirements.txt</p>
                </div>

                <div>
                  <span className="text-slate-500"># 3. Boot tracking daemon and webcam</span>
                  <p className="text-cyan-400 mt-1">python python/main.py</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1 text-xs">
                  <p className="text-[#8CC0EB] font-bold">[DAEMON STATUS]</p>
                  <p>Initializing MediaPipe hand engine...</p>
                  <p>Selected webcam device: Camera ID 0 (1920x1080 @ 30 FPS)</p>
                  <p className="text-emerald-400 font-semibold">Ready. Wave hand over screen to verify coords.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      </div> {/* Closes Lower Content Wrapper */}

      {/* ──────────────────────────────────────────────────────── */}
      {/* PREMIUM NEWSLETTER / FOOTER SECTION */}
      {/* ──────────────────────────────────────────────────────── */}
      <footer className="relative w-full pt-20 pb-12 px-6 bg-slate-900 text-slate-400 z-30 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-slate-800">
            
            {/* Logo */}
            <div className="md:col-span-5 space-y-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤚</span>
                <span className="font-heading font-extrabold text-xl tracking-tight text-white">
                  DEXTRA
                </span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Contactless gesture-driven computing interfaces built for modern operating systems. Safe, rapid, and private.
              </p>
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-full bg-slate-800 hover:bg-[#8CC0EB] hover:text-slate-900 transition-all text-slate-300">
                  <Play className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-full bg-slate-800 hover:bg-[#8CC0EB] hover:text-slate-900 transition-all text-slate-300">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider font-heading">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#gestures" className="hover:text-white transition-colors">Gestures Registry</a></li>
                <li><a href="#setup" className="hover:text-white transition-colors">Setup Guide</a></li>
                <li><button onClick={() => navigate('/app')} className="hover:text-white transition-colors text-left">Dashboard Login</button></li>
              </ul>
            </div>

            {/* Support */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider font-heading">Stay Connected</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Subscribe to get notifications on gesture libraries improvements and AI model updates.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); alert("Thanks for subscribing!"); }} className="flex gap-2">
                <input 
                  type="email" 
                  required
                  placeholder="Enter your email" 
                  className="bg-slate-800 border border-slate-700/60 rounded-full px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8CC0EB] w-full"
                />
                <button 
                  type="submit" 
                  className="bg-[#8CC0EB] hover:bg-[#6aabdb] text-slate-900 font-bold px-4 py-2.5 rounded-full text-xs transition-colors shrink-0"
                >
                  Join
                </button>
              </form>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} DEXTRA Controller Project. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-300">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300">License Terms</a>
              <a href="#" className="hover:text-slate-300">Security Audit</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
