import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { AppSection } from '../../controllers/useUserController';
import {
  createValveAndGauge3D,
  type ValveGauge3DRig,
} from './steampunkInstrumentation';

interface SteampunkBackgroundProps {
  activeSection: AppSection;
  steamBurst: number;
  onTriggerBoost?: () => void;
}

/**
 * Exact kinematic formula for two meshing spur gears in the XY plane:
 * Given driver Gear A (teeth nA, angle thetaA) and driven Gear B (teeth nB)
 * positioned at angle `alphaDeg` from Gear A's center, returns the exact
 * rotation angle `thetaB` so that Gear A's teeth interlock with Gear B's valleys.
 */
function calcMeshedAngle(
  thetaA: number,
  nA: number,
  nB: number,
  alphaDeg: number
): number {
  const alpha = (alphaDeg * Math.PI) / 180;
  const ratio = nA / nB;
  return -thetaA * ratio + alpha * (1 + ratio) + Math.PI * (1 - 1 / nB);
}

function createSoftParticleTexture(
  colorStops: [number, string][]
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  for (const [stop, color] of colorStops) {
    gradient.addColorStop(stop, color);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export function SteampunkBackground({
  activeSection,
  steamBurst,
  onTriggerBoost,
}: SteampunkBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetCameraOffset = useRef<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 9.2,
  });
  const boostVelocityRef = useRef<number>(1);
  const valveRigRef = useRef<ValveGauge3DRig | null>(null);
  const onTriggerBoostRef = useRef(onTriggerBoost);

  const [isHoldingValve, setIsHoldingValve] = useState(false);
  const [psiReadout, setPsiReadout] = useState(18);

  useEffect(() => {
    onTriggerBoostRef.current = onTriggerBoost;
  }, [onTriggerBoost]);

  useEffect(() => {
    switch (activeSection) {
      case 'login':
        targetCameraOffset.current = { x: -0.6, y: 0.15, z: 9.0 };
        break;
      case 'register':
        targetCameraOffset.current = { x: 0.65, y: -0.15, z: 9.4 };
        break;
      case 'profile':
        targetCameraOffset.current = { x: 0.0, y: 0.2, z: 8.8 };
        break;
    }
    boostVelocityRef.current = Math.max(boostVelocityRef.current, 2.4);
  }, [activeSection]);

  useEffect(() => {
    if (steamBurst > 0) {
      boostVelocityRef.current = Math.min(
        11.0,
        Math.max(boostVelocityRef.current + 3.2, 4.8)
      );
      valveRigRef.current?.triggerBurst();
    }
  }, [steamBurst]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0907, 0.048);

    const camera = new THREE.PerspectiveCamera(
      46,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 9.2);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Warm industrial lighting highlighting the metallic gear teeth
    const ambientLight = new THREE.AmbientLight(0x3d2b1c, 1.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffc57a, 3.6);
    keyLight.position.set(5, 7, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xc86d3b, 2.1);
    fillLight.position.set(-7, -4, 6);
    scene.add(fillLight);

    const backLight = new THREE.PointLight(0xff9d3b, 4.0, 18, 1.4);
    backLight.position.set(0.5, 0.5, 2.5);
    scene.add(backLight);

    // Root Group for our Interlocking Clockwork Gear Train
    const mechanismGroup = new THREE.Group();
    mechanismGroup.rotation.x = -0.14;
    mechanismGroup.rotation.y = 0.18;
    scene.add(mechanismGroup);

    const gears: Record<string, THREE.Object3D> = {};

    const loader = new GLTFLoader();
    loader.load('/models/steampunk_mechanism.glb', (gltf) => {
      const root = gltf.scene;
      root.traverse((child) => {
        if (child.name.startsWith('Gear_')) {
          gears[child.name] = child;
        }
      });
      mechanismGroup.add(root);
    });

    // -----------------------------------------------------------------------
    // Static 3D Instrumentation Layer (Zero Parallax):
    // Pressure Gauge & Steam Valve (Bottom-Right)
    // Rendered with a fixed camera so it never shifts with mouse parallax
    // -----------------------------------------------------------------------
    const hudScene = new THREE.Scene();
    const hudCamera = new THREE.PerspectiveCamera(
      46,
      window.innerWidth / window.innerHeight,
      0.1,
      50
    );
    hudCamera.position.set(0, 0, 0);
    hudCamera.lookAt(0, 0, -1);

    const hudAmbient = new THREE.AmbientLight(0x4a3623, 2.2);
    hudScene.add(hudAmbient);

    const hudKeyLight = new THREE.DirectionalLight(0xffd296, 3.4);
    hudKeyLight.position.set(3, 5, 6);
    hudScene.add(hudKeyLight);

    const hudFillLight = new THREE.DirectionalLight(0xc86d3b, 1.8);
    hudFillLight.position.set(-4, -2, 5);
    hudScene.add(hudFillLight);

    const valveRig = createValveAndGauge3D(() => {
      boostVelocityRef.current = Math.min(
        11.5,
        Math.max(boostVelocityRef.current + 3.0, 5.2)
      );
      onTriggerBoostRef.current?.();
    });
    valveRigRef.current = valveRig;
    hudScene.add(valveRig.group);

    const updateHudAnchors = () => {
      const hudDepth = 4.6;
      const halfFovRad = THREE.MathUtils.degToRad(hudCamera.fov * 0.5);
      const halfHeight = hudDepth * Math.tan(halfFovRad);
      const halfWidth = halfHeight * hudCamera.aspect;

      const isCompact = window.innerWidth < 760;
      const valveScale = isCompact ? 0.33 : 0.44;

      // Bottom-right 3D Pressure Gauge & Steam Valve — strictly frontal, zero parallax
      valveRig.group.scale.setScalar(valveScale);
      valveRig.group.position.set(
        halfWidth - (isCompact ? 0.54 : 0.78),
        -halfHeight + (isCompact ? 0.3 : 0.4),
        -hudDepth
      );
      valveRig.group.rotation.set(0, 0, 0);
    };

    updateHudAnchors();

    // Subtle rising steam particles
    const steamCount = 70;
    const steamPositions = new Float32Array(steamCount * 3);
    const steamSpeeds = new Float32Array(steamCount);
    for (let i = 0; i < steamCount; i++) {
      steamPositions[i * 3] = (Math.random() - 0.5) * 18;
      steamPositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      steamPositions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1.5;
      steamSpeeds[i] = 0.006 + Math.random() * 0.01;
    }
    const steamGeometry = new THREE.BufferGeometry();
    steamGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(steamPositions, 3)
    );
    const steamTexture = createSoftParticleTexture([
      [0, 'rgba(220, 200, 175, 0.14)'],
      [0.5, 'rgba(160, 130, 100, 0.05)'],
      [1, 'rgba(12, 9, 7, 0)'],
    ]);
    const steamMaterial = new THREE.PointsMaterial({
      size: 2.8,
      map: steamTexture,
      transparent: true,
      depthWrite: false,
    });
    const steamPoints = new THREE.Points(steamGeometry, steamMaterial);
    scene.add(steamPoints);

    // Subtle mouse parallax
    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      const aspect = window.innerWidth / window.innerHeight;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      hudCamera.aspect = aspect;
      hudCamera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      updateHudAnchors();
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const clock = new THREE.Clock();
    let driverAngle = 0;
    let psiUpdateAccumulator = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      boostVelocityRef.current = THREE.MathUtils.lerp(
        boostVelocityRef.current,
        1.0,
        delta * 2.5
      );
      const speed = boostVelocityRef.current;

      // Update 3D Valve + Pressure Gauge (strictly fixed, no parallax)
      valveRig.update(elapsed, delta);

      psiUpdateAccumulator += delta;
      if (psiUpdateAccumulator > 0.12) {
        psiUpdateAccumulator = 0;
        setPsiReadout(Math.round(valveRig.getPressure()));
      }

      // Primary Driver Gear (Gear_01: 24 teeth) rotates smoothly around Z
      driverAngle += delta * 0.28 * speed;

      const theta1 = driverAngle;
      const theta2 = calcMeshedAngle(theta1, 24, 16, 15.0);
      const theta3 = calcMeshedAngle(theta2, 16, 12, 72.0);
      const theta4 = calcMeshedAngle(theta2, 16, 20, -52.0);
      const theta5 = calcMeshedAngle(theta1, 24, 14, 122.0);
      const theta6 = calcMeshedAngle(theta1, 24, 18, -128.0);
      const theta7 = theta2;
      const theta8 = calcMeshedAngle(theta7, 28, 15, -155.0);

      if (gears.Gear_01) gears.Gear_01.rotation.z = theta1;
      if (gears.Gear_02) gears.Gear_02.rotation.z = theta2;
      if (gears.Gear_03) gears.Gear_03.rotation.z = theta3;
      if (gears.Gear_04) gears.Gear_04.rotation.z = theta4;
      if (gears.Gear_05) gears.Gear_05.rotation.z = theta5;
      if (gears.Gear_06) gears.Gear_06.rotation.z = theta6;
      if (gears.Gear_07_Coaxial2) gears.Gear_07_Coaxial2.rotation.z = theta7;
      if (gears.Gear_08_Deep) gears.Gear_08_Deep.rotation.z = theta8;

      // Update steam particles
      const steamPosAttr = steamGeometry.getAttribute(
        'position'
      ) as THREE.BufferAttribute;
      for (let i = 0; i < steamCount; i++) {
        let y = steamPosAttr.getY(i);
        let x = steamPosAttr.getX(i);
        y += steamSpeeds[i] * speed;
        x += Math.sin(elapsed * 0.4 + i) * 0.002;
        if (y > 6.5) {
          y = -6.5;
          x = (Math.random() - 0.5) * 18;
        }
        steamPosAttr.setXY(i, x, y);
      }
      steamPosAttr.needsUpdate = true;

      // Balanced, noticeable mouse parallax (camera shift + subtle mechanism tilt + light shift)
      const targetX = targetCameraOffset.current.x + mouse.x * 1.15;
      const targetY = targetCameraOffset.current.y + mouse.y * 0.85;
      const targetZ = targetCameraOffset.current.z;

      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x,
        targetX,
        delta * 3.8
      );
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        targetY,
        delta * 3.8
      );
      camera.position.z = THREE.MathUtils.lerp(
        camera.position.z,
        targetZ,
        delta * 3.2
      );
      camera.lookAt(0.4 - mouse.x * 0.25, -mouse.y * 0.18, 0);

      mechanismGroup.rotation.x = THREE.MathUtils.lerp(
        mechanismGroup.rotation.x,
        -0.14 - mouse.y * 0.14,
        delta * 3.5
      );
      mechanismGroup.rotation.y = THREE.MathUtils.lerp(
        mechanismGroup.rotation.y,
        0.18 + mouse.x * 0.18,
        delta * 3.5
      );

      backLight.position.x = 0.5 + mouse.x * 2.5;
      backLight.position.y = 0.5 + mouse.y * 2.0;

      renderer.autoClear = true;
      renderer.render(scene, camera);
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(hudScene, hudCamera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  const handleValveDown = () => {
    setIsHoldingValve(true);
    valveRigRef.current?.setHolding(true);
  };

  const handleValveUp = () => {
    setIsHoldingValve(false);
    valveRigRef.current?.setHolding(false);
  };

  return (
    <>
      <div
        ref={containerRef}
        className="steampunk-canvas-container"
        aria-hidden="true"
      />

      {/* Hitbox interactiva inferior derecha: Manómetro y Válvula 3D */}
      <button
        type="button"
        className={`hud-3d-valve-hitbox ${isHoldingValve ? 'is-holding' : ''} ${
          psiReadout > 75 ? 'is-overpressure' : ''
        }`}
        onPointerDown={handleValveDown}
        onPointerUp={handleValveUp}
        onPointerLeave={handleValveUp}
        title="Mantener o girar la válvula 3D para inyectar vapor y acelerar la maquinaria"
        aria-label="Válvula 3D de presión de vapor"
      >
        <span className="hud-3d-tag">
          VÁLVULA DE VAPOR • {psiReadout} PSI
        </span>
      </button>
    </>
  );
}
