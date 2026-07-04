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

    // Drag-to-rotate parameters (starts at Math.PI to default to front view)
    let isDragging = false;
    let userRotationX = 0;
    let userRotationY = Math.PI; // Face front view by default
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseMoveWindow = (e) => {
      // Normalize coordinates (-1 to 1)
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;

      // Hover feedback - change cursor to pointer 'grab' hand when hovering over the model proxy
      if (!isDragging && modelRef.current) {
        mouseVector.x = targetMouseX;
        mouseVector.y = targetMouseY;
        raycaster.setFromCamera(mouseVector, camera);

        const intersects = raycaster.intersectObject(proxyMesh);
        if (intersects.length > 0) {
          document.body.style.cursor = 'grab';
        } else {
          if (document.body.style.cursor === 'grab') {
            document.body.style.cursor = '';
          }
        }
      }
    };
    window.addEventListener('mousemove', handleMouseMoveWindow);

    // drag event handler functions
    const onMouseMoveDrag = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      // Adjust rotation speed sensitivity
      userRotationY += deltaX * 0.008;
      userRotationX += deltaY * 0.008;

      // Constrain vertical rotation to prevent upside-down camera flips
      userRotationX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, userRotationX));

      previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
    };

    const onMouseUpDrag = () => {
      isDragging = false;
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMoveDrag);
      window.removeEventListener('mouseup', onMouseUpDrag);
    };

    const onMouseDownWindow = (e) => {
      if (e.button !== 0) return; // Left click only

      mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouseVector, camera);

      if (modelRef.current) {
        const intersects = raycaster.intersectObject(proxyMesh);
        if (intersects.length > 0) {
          isDragging = true;
          previousMousePosition = {
            x: e.clientX,
            y: e.clientY
          };
          document.body.style.cursor = 'grabbing';

          // Bind drag tracking listeners
          window.addEventListener('mousemove', onMouseMoveDrag);
          window.addEventListener('mouseup', onMouseUpDrag);
        }
      }
    };
    window.addEventListener('mousedown', onMouseDownWindow);

    // Keyframes for the 3D model scroll path overlay
    const keyframes = [
      { progress: 0.0, x: 2.3, y: 1.4, scale: 1.1 },
      { progress: 0.2, x: -1.8, y: 0.8, scale: 1.35 },
      { progress: 0.45, x: 1.7, y: -0.7, scale: 1.5 },
      { progress: 0.75, x: -1.7, y: -0.3, scale: 1.25 },
      { progress: 1.0, x: 1.3, y: 0.4, scale: 1.15 }
    ];

    // 8. Animation & Render Loop
    let animationFrameId;

    const tick = () => {
      const elapsedTime = (performance.now() - startTime) * 0.001;

      if (modelRef.current) {
        // Read progress value from motion spring (value between 0 and 1)
        const progress = smoothProgress ? smoothProgress.get() : 0;

        // Find the bracketing keyframes
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

        // Smoothly interpolate target coordinates
        const targetX = THREE.MathUtils.lerp(prev.x, next.x, t);
        const targetY = THREE.MathUtils.lerp(prev.y, next.y, t);
        const targetScale = THREE.MathUtils.lerp(prev.scale, next.scale, t);

        // 9. Parallax Mouse Wide Glide Translation (Lerped)
        currentMouseX = THREE.MathUtils.lerp(currentMouseX, targetMouseX, 0.05);
        currentMouseY = THREE.MathUtils.lerp(currentMouseY, targetMouseY, 0.05);

        // Subtle zero-gravity float/drift
        const driftX = Math.sin(elapsedTime * 1.3) * 0.18;
        const driftY = Math.cos(elapsedTime * 0.8) * 0.18;

        // Combine base scroll coordinates, expanded mouse glide translations, and float drift
        const finalX = targetX + currentMouseX * 3.2 + driftX;
        const finalY = targetY + currentMouseY * 2.2 + driftY;

        // Apply smooth lerping to model transformations
        modelRef.current.position.x = THREE.MathUtils.lerp(modelRef.current.position.x, finalX, 0.08);
        modelRef.current.position.y = THREE.MathUtils.lerp(modelRef.current.position.y, finalY, 0.08);
        modelRef.current.position.z = THREE.MathUtils.lerp(modelRef.current.position.z, 0, 0.08);
        
        // Base scale (2.0 normalized) * scroll target scale
        const baseNormScale = 2.0 / maxDim; 
        modelRef.current.scale.setScalar(THREE.MathUtils.lerp(modelRef.current.scale.x, targetScale * baseNormScale, 0.08));

        // Set rotation dynamically based on user click & drag
        modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, userRotationX, 0.12);
        modelRef.current.rotation.y = THREE.MathUtils.lerp(modelRef.current.rotation.y, userRotationY, 0.12);
        modelRef.current.rotation.z = 0;

        // Position core sphere inside model
        coreMesh.position.copy(modelRef.current.position);
        coreMesh.rotation.copy(modelRef.current.rotation);

        // Position and scale proxy mesh inside model
        proxyMesh.position.copy(modelRef.current.position);
        proxyMesh.scale.copy(modelRef.current.scale);
      }

      // 10. Pulse energy core sphere
      if (coreRef.current) {
        const pulse = (1.0 + Math.sin(elapsedTime * 2.8) * 0.07) * (modelRef.current ? modelRef.current.scale.x * (maxDim / 2.0) : 1);
        coreRef.current.scale.setScalar(pulse * 0.35); // Core sized relative to body scale
        coreMaterial.opacity = 0.5 + Math.sin(elapsedTime * 2.8) * 0.15;
      }

      // 11. Interactive Point Light cursor mapping
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

    // 12. Handle Resize
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
      
      // Make sure we reset cursor style on exit
      document.body.style.cursor = '';
      
      // Dispose resources
      renderer.dispose();
      coreMaterial.dispose();
      coreGeo.dispose();
      proxyGeo.dispose();
      proxyMat.dispose();
    };
  }, [smoothProgress]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-transparent">
      <canvas ref={canvasRef} className="w-full h-full block bg-transparent" />
    </div>
  );
}
