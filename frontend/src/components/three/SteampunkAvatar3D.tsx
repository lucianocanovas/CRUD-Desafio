import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SteampunkAvatarId } from '../../models/user.model';
import {
  buildSteampunkAvatarRig,
  getAvatarMeta,
  type AnimatedAvatarRig,
} from './steampunkAvatars';

interface SteampunkAvatar3DProps {
  avatarId: SteampunkAvatarId;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  className?: string;
  title?: string;
}

interface ActiveViewport {
  id: symbol;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  rig: AnimatedAvatarRig;
  internalRes: number;
  phaseOffset: number;
  hoverRef: { active: boolean; pointerX: number; pointerY: number };
}

// Singleton shared offscreen PSX WebGLRenderer so we can render any number of
// 3D animated avatars simultaneously without hitting WebGL context limits.
let sharedRenderer: THREE.WebGLRenderer | null = null;
const activeViewports = new Map<symbol, ActiveViewport>();
let globalRafId: number | null = null;
const globalClock = new THREE.Clock();

function getSharedPsxRenderer(): THREE.WebGLRenderer {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({
      antialias: false, // Authentic jagged low-poly PSX edges
      alpha: true,
      powerPreference: 'high-performance',
    });
    sharedRenderer.setPixelRatio(1);
    sharedRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    sharedRenderer.toneMappingExposure = 1.25;
  }
  return sharedRenderer;
}

function startGlobalAvatarLoop() {
  if (globalRafId !== null) return;

  const tick = () => {
    if (activeViewports.size === 0) {
      globalRafId = null;
      return;
    }

    globalRafId = requestAnimationFrame(tick);
    const elapsed = globalClock.getElapsedTime();
    const renderer = getSharedPsxRenderer();

    activeViewports.forEach((vp) => {
      const res = vp.internalRes;
      if (
        renderer.domElement.width !== res ||
        renderer.domElement.height !== res
      ) {
        renderer.setSize(res, res, false);
      }

      const boost = vp.hoverRef.active ? 1.65 : 1.0;
      vp.rig.updateIdle(elapsed + vp.phaseOffset, boost);

      // Subtle interactive parallax when hovered
      const targetRotY = vp.hoverRef.active ? vp.hoverRef.pointerX * 0.55 : 0;
      const targetRotX = vp.hoverRef.active ? vp.hoverRef.pointerY * 0.28 : 0;
      vp.rig.root.rotation.y = THREE.MathUtils.lerp(
        vp.rig.root.rotation.y,
        targetRotY,
        0.12
      );
      vp.rig.root.rotation.x = THREE.MathUtils.lerp(
        vp.rig.root.rotation.x,
        targetRotX,
        0.12
      );

      renderer.render(vp.scene, vp.camera);

      vp.ctx.clearRect(0, 0, res, res);
      vp.ctx.drawImage(renderer.domElement, 0, 0, res, res);
    });
  };

  globalRafId = requestAnimationFrame(tick);
}

const SIZE_CONFIG: Record<
  NonNullable<SteampunkAvatar3DProps['size']>,
  { cssPx: number; psxRes: number }
> = {
  xs: { cssPx: 30, psxRes: 56 },
  sm: { cssPx: 44, psxRes: 68 },
  md: { cssPx: 66, psxRes: 84 },
  lg: { cssPx: 96, psxRes: 104 },
};

export function SteampunkAvatar3D({
  avatarId,
  size = 'md',
  interactive = true,
  className = '',
  title,
}: SteampunkAvatar3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoverRef = useRef({ active: false, pointerX: 0, pointerY: 0 });
  const meta = getAvatarMeta(avatarId);
  const { cssPx, psxRes } = SIZE_CONFIG[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20);
    camera.position.set(0, 0.12, 3.15);
    camera.lookAt(0, 0.02, 0);

    // Warm Steampunk + Character Accent Lighting
    const ambient = new THREE.AmbientLight(0x4a3525, 2.3);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffdfa8, 3.8);
    keyLight.position.set(2.5, 3.5, 4.0);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(meta.glowColor, 4.5, 8, 1.2);
    rimLight.position.set(-2.0, 1.2, 1.8);
    scene.add(rimLight);

    // Background rotating low-poly brass halo cog for extra depth
    const rig = buildSteampunkAvatarRig(avatarId);
    scene.add(rig.root);

    const vpId = Symbol(avatarId);
    const phaseOffset =
      avatarId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) * 0.17;

    activeViewports.set(vpId, {
      id: vpId,
      canvas,
      ctx,
      scene,
      camera,
      rig,
      internalRes: psxRes,
      phaseOffset,
      hoverRef: hoverRef.current,
    });

    startGlobalAvatarLoop();

    return () => {
      activeViewports.delete(vpId);
    };
  }, [avatarId, meta.glowColor, psxRes]);

  return (
    <div
      className={`psx-avatar-frame psx-avatar-${size} ${className}`}
      style={
        {
          width: `${cssPx}px`,
          height: `${cssPx}px`,
          '--avatar-accent': meta.accentColor,
        } as React.CSSProperties
      }
      title={title ?? `${meta.name} — ${meta.title}`}
      onMouseEnter={() => {
        if (interactive) hoverRef.current.active = true;
      }}
      onMouseLeave={() => {
        hoverRef.current.active = false;
        hoverRef.current.pointerX = 0;
        hoverRef.current.pointerY = 0;
      }}
      onMouseMove={(e) => {
        if (!interactive) return;
        const rect = e.currentTarget.getBoundingClientRect();
        hoverRef.current.pointerX =
          ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        hoverRef.current.pointerY =
          ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      }}
    >
      <canvas
        ref={canvasRef}
        width={psxRes}
        height={psxRes}
        className="psx-avatar-canvas"
      />
      <span className="psx-scanline-overlay" aria-hidden="true" />
    </div>
  );
}

