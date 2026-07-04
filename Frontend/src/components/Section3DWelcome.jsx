import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function Section3DWelcome({ 
  smoothProgress, 
  onLoadProgress, 
  onLoaded 
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const coreRef = useRef(null);
  const mouseLightRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    // Clock/Time for timing animations
    const startTime = performance.now();

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. Lights
    // Ambient light - dark blue-indigo tone matching the shadows
    const ambientLight = new THREE.AmbientLight(0x101525, 0.7);
    scene.add(ambientLight);

    // Main directional light - cool electric blue key light
    const dirLight = new THREE.DirectionalLight(0x5a9ed6, 1.8);
    dirLight.position.set(5, 5, 4);
    scene.add(dirLight);

    // Rim light - bright glowing neon cyan outline highlights
    const rimLight = new THREE.DirectionalLight(0x00ffff, 1.4);
    rimLight.position.set(-5, -3, -2);
    scene.add(rimLight);

    // Mouse point light - interactive glowing cyan cursor sheen
    const mouseLight = new THREE.PointLight(0x00ffff, 3.5, 12);
    mouseLight.position.set(0, 0, 4);
    scene.add(mouseLight);
    mouseLightRef.current = mouseLight;

    // 5. Materials
    // Pulsing core energy sphere material (glowing electric cyan/neon blue)
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x80ffff,      // Electric cyan / neon blue
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    // 6. Pulse Core Geometry
    const coreGeo = new THREE.SphereGeometry(0.35, 32, 32); // Core size
    const coreMesh = new THREE.Mesh(coreGeo, coreMaterial);
    scene.add(coreMesh);
    coreRef.current = coreMesh;

    // Raycast proxy for hover/click detection: a simple invisible sphere matching the approximate size of the model.
    const proxyGeo = new THREE.SphereGeometry(1.6, 8, 8);
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
    const proxyMesh = new THREE.Mesh(proxyGeo, proxyMat);
    scene.add(proxyMesh);

    // 7. Load GLB Model with GLTFLoader and custom color scheme
    let maxDim = 4; // default dim fallback
    const triggerFallback = () => {
      console.warn('GLB Loading failed, using placeholder sphere.');
      const fallbackGeo = new THREE.IcosahedronGeometry(0.9, 2);
      const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x5a9ed6 });
      const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
      scene.add(fallbackMesh);
      modelRef.current = fallbackMesh;
      if (onLoaded) onLoaded();
    };

    const gltfLoader = new GLTFLoader();
    gltfLoader.setPath('/OBJECT/');
    gltfLoader.load(
      'Meshy_AI_Neon_Ring_Interface_0704063213_texture.glb',
      (gltf) => {
        const model = gltf.scene;

        // Center and normalize model size
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.sub(center); // Center geometry

        const size = new THREE.Vector3();
        box.getSize(size);
        maxDim = Math.max(size.x, size.y, size.z);
        model.userData = { maxDim };
        
        // Scale to a smaller, more refined size
        const targetScale = 2.4 / maxDim;
        model.scale.setScalar(targetScale);

        // Apply materials and textures safely using non-recursive queue BFS
        const loadedMeshes = [];
        const queue = [model];
        while (queue.length > 0) {
          const current = queue.shift();
          if (current.isMesh) {
            loadedMeshes.push(current);
          }
          if (current.children) {
            queue.push(...current.children);
          }
        }

        loadedMeshes.forEach((mesh) => {
          // Extract original map/texture if present
          const originalMap = mesh.material && mesh.material.map ? mesh.material.map : null;

          // Create a high-performance standard sci-fi material with colors from the image
          const customMaterial = new THREE.MeshStandardMaterial({
            color: 0x8caabe,        // Steel-blue base/body color from image
            map: originalMap,
            emissive: 0x2da6c1,     // Vibrant cyan emissive glow color from image
            emissiveMap: originalMap,
            emissiveIntensity: 2.2,
            metalness: 0.85,
            roughness: 0.25,
            transparent: true,
            opacity: 0.95
          });

          mesh.material = customMaterial;
        });

        // Add model to scene
        scene.add(model);
        modelRef.current = model;

        // Callback indicating successful load
        if (onLoaded) onLoaded();
      },
      (xhr) => {
        if (xhr.total > 0 && onLoadProgress) {
          const progress = Math.round((xhr.loaded / xhr.total) * 100);
          onLoadProgress(progress);
        }
      },
      (err) => {
        console.error('Error loading GLB asset:', err);
        triggerFallback();
      }
    );

    // Track mouse coordinates
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    // Raycaster for click and drag-to-rotate detection
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    // Drag, translate, and scale parameters
    let isTranslating = false;
    let isRotating = false;
    let userOffsetX = 0;
    let userOffsetY = 0;
    let userScaleMultiplier = 1.0;
    let userRotationX = 0;
    let userRotationY = Math.PI; // Face front view by default
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseMoveWindow = (e) => {
      // Normalize coordinates (-1 to 1)
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;

      // Hover feedback - change cursor when hovering over the model proxy
      if (!isTranslating && !isRotating && modelRef.current) {
        mouseVector.x = targetMouseX;
        mouseVector.y = targetMouseY;
        raycaster.setFromCamera(mouseVector, camera);

        const intersects = raycaster.intersectObject(proxyMesh);
        if (intersects.length > 0) {
          document.body.style.cursor = 'move';
        } else {
          if (document.body.style.cursor === 'move') {
            document.body.style.cursor = '';
          }
        }
      }
    };
    window.addEventListener('mousemove', handleMouseMoveWindow);

    // drag event handler functions
    const onMouseMoveDrag = (e) => {
      if (!isTranslating && !isRotating) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      if (isRotating) {
        // Adjust rotation speed sensitivity
        userRotationY += deltaX * 0.008;
        userRotationX += deltaY * 0.008;

        // Constrain vertical rotation to prevent upside-down camera flips
        userRotationX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, userRotationX));
      } else if (isTranslating) {
        // Translate mouse movement to 3D world coordinates
        const factor = 0.007;
        userOffsetX += deltaX * factor;
        userOffsetY -= deltaY * factor;
      }

      previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
    };

    const onMouseUpDrag = () => {
      isTranslating = false;
      isRotating = false;
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMoveDrag);
      window.removeEventListener('mouseup', onMouseUpDrag);
    };

    const onMouseDownWindow = (e) => {
      mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouseVector, camera);

      if (modelRef.current) {
        const intersects = raycaster.intersectObject(proxyMesh);
        if (intersects.length > 0) {
          previousMousePosition = {
            x: e.clientX,
            y: e.clientY
          };

          // If Shift key is held down or right-click, we rotate. Otherwise, we translate (drag and move)
          if (e.shiftKey || e.button === 2) {
            isRotating = true;
            isTranslating = false;
            document.body.style.cursor = 'grabbing';
          } else if (e.button === 0) {
            isTranslating = true;
            isRotating = false;
            document.body.style.cursor = 'move';
          }

          window.addEventListener('mousemove', onMouseMoveDrag);
          window.addEventListener('mouseup', onMouseUpDrag);
          
          if (e.button === 2) {
            e.preventDefault();
          }
        }
      }
    };
    window.addEventListener('mousedown', onMouseDownWindow);

    // Prevent context menu when right-click dragging on canvas/model
    const handleContextMenu = (e) => {
      mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);

      if (modelRef.current) {
        const intersects = raycaster.intersectObject(proxyMesh);
        if (intersects.length > 0) {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);

    // Scale/Zoom handling via Mouse Wheel
    const handleWheel = (e) => {
      mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);

      if (modelRef.current) {
        const intersects = raycaster.intersectObject(proxyMesh);
        if (intersects.length > 0) {
          e.preventDefault();
          const zoomSpeed = 0.0015;
          userScaleMultiplier -= e.deltaY * zoomSpeed;
          userScaleMultiplier = Math.max(0.1, Math.min(6.0, userScaleMultiplier));
        }
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Handle Reset view action
    const resetBtn = document.getElementById('btn-reset-3d-model');
    const handleReset = () => {
      userOffsetX = 0;
      userOffsetY = 0;
      userScaleMultiplier = 1.0;
      userRotationX = 0;
      userRotationY = Math.PI;
    };
    if (resetBtn) {
      resetBtn.addEventListener('click', handleReset);
    }

    // Keyframes for the 3D model scroll path overlay
    const keyframes = [
      { progress: 0.0, x: 2.3, y: 1.4, scale: 1.1 },
      { progress: 0.2, x: -1.8, y: 0.8, scale: 1.35 },
      { progress: 0.45, x: 1.7, y: -0.7, scale: 0.85 },
      { progress: 0.75, x: -1.7, y: -0.3, scale: 1.25 },
      { progress: 1.0, x: 1.3, y: 0.4, scale: 1.15 }
    ];

    // 8. Animation & Render Loop
    let animationFrameId;

    const tick = () => {
      const elapsedTime = (performance.now() - startTime) * 0.001;

      if (modelRef.current) {
        const progress = smoothProgress ? smoothProgress.get() : 0;

        let prev = keyframes[0];
        let next = keyframes[keyframes.length - 1];

        for (let i = 0; i < keyframes.length - 1; i++) {
          if (progress >= keyframes[i].progress && progress <= keyframes[i+1].progress) {
            prev = keyframes[i];
            next = keyframes[i+1];
            break;
          }
        }

        const range = next.progress - prev.progress;
        const t = range > 0 ? (progress - prev.progress) / range : 0;

        const targetX = THREE.MathUtils.lerp(prev.x, next.x, t);
        const targetY = THREE.MathUtils.lerp(prev.y, next.y, t);
        const targetScale = THREE.MathUtils.lerp(prev.scale, next.scale, t);

        currentMouseX = THREE.MathUtils.lerp(currentMouseX, targetMouseX, 0.05);
        currentMouseY = THREE.MathUtils.lerp(currentMouseY, targetMouseY, 0.05);

        const driftX = Math.sin(elapsedTime * 1.3) * 0.18;
        const driftY = Math.cos(elapsedTime * 0.8) * 0.18;

        const finalX = targetX + currentMouseX * 3.2 + driftX + userOffsetX;
        const finalY = targetY + currentMouseY * 2.2 + driftY + userOffsetY;

        modelRef.current.position.x = THREE.MathUtils.lerp(modelRef.current.position.x, finalX, 0.08);
        modelRef.current.position.y = THREE.MathUtils.lerp(modelRef.current.position.y, finalY, 0.08);
        modelRef.current.position.z = THREE.MathUtils.lerp(modelRef.current.position.z, 0, 0.08);
        
        const baseNormScale = 2.0 / maxDim; 
        const finalScale = targetScale * baseNormScale * userScaleMultiplier;
        modelRef.current.scale.setScalar(THREE.MathUtils.lerp(modelRef.current.scale.x, finalScale, 0.08));

        modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, userRotationX, 0.12);
        modelRef.current.rotation.y = THREE.MathUtils.lerp(modelRef.current.rotation.y, userRotationY, 0.12);
        modelRef.current.rotation.z = 0;

        coreMesh.position.copy(modelRef.current.position);
        coreMesh.rotation.copy(modelRef.current.rotation);

        proxyMesh.position.copy(modelRef.current.position);
        proxyMesh.scale.copy(modelRef.current.scale);
      }

      if (coreRef.current) {
        const pulse = (1.0 + Math.sin(elapsedTime * 2.8) * 0.07) * (modelRef.current ? modelRef.current.scale.x * (maxDim / 2.0) : 1);
        coreRef.current.scale.setScalar(pulse * 0.35); 
        coreMaterial.opacity = 0.5 + Math.sin(elapsedTime * 2.8) * 0.15;
      }

      if (mouseLightRef.current) {
        const lightX = currentMouseX * 4.5;
        const lightY = currentMouseY * 3.5;
        mouseLightRef.current.position.x = THREE.MathUtils.lerp(mouseLightRef.current.position.x, lightX, 0.08);
        mouseLightRef.current.position.y = THREE.MathUtils.lerp(mouseLightRef.current.position.y, lightY, 0.08);
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveWindow);
      window.removeEventListener('mousedown', onMouseDownWindow);
      window.removeEventListener('mousemove', onMouseMoveDrag);
      window.removeEventListener('mouseup', onMouseUpDrag);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('wheel', handleWheel);
      
      if (resetBtn) {
        resetBtn.removeEventListener('click', handleReset);
      }
      
      document.body.style.cursor = '';
      
      renderer.dispose();
      coreMaterial.dispose();
      coreGeo.dispose();
      proxyGeo.dispose();
      proxyMat.dispose();
    };
  }, [smoothProgress]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-transparent group">
      <canvas ref={canvasRef} className="w-full h-full block bg-transparent pointer-events-auto" />
      
      {/* Floating interactive HUD */}
      <div className="absolute bottom-6 right-6 p-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto flex flex-col gap-3 text-xs text-cyan-200 font-mono select-none max-w-xs shadow-lg shadow-cyan-950/20 z-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-0.5">
          <span className="font-bold uppercase tracking-wider text-cyan-400">3D Interaction HUD</span>
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
        </div>
        <div className="flex flex-col gap-1 text-[11px] text-white/70 font-sans">
          <div className="flex justify-between gap-4 font-mono text-[10px]"><span className="text-cyan-400">Drag Model:</span> <span>Move Position</span></div>
          <div className="flex justify-between gap-4 font-mono text-[10px]"><span className="text-cyan-400">Shift+Drag / Right-Click:</span> <span>Orbit Rotate</span></div>
          <div className="flex justify-between gap-4 font-mono text-[10px]"><span className="text-cyan-400">Mouse Wheel:</span> <span>Resize / Zoom</span></div>
        </div>
        <div className="flex gap-2 mt-1 pt-1.5 border-t border-white/10">
          <button 
            id="btn-reset-3d-model"
            className="flex-1 px-2.5 py-1.5 rounded bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 active:bg-cyan-500/40 text-cyan-300 font-bold transition-all text-center cursor-pointer text-[10px] tracking-wider font-mono"
          >
            RESET VIEW
          </button>
        </div>
      </div>
    </div>
  );
}
