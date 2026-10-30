import * as THREE from 'three';
import type { SteampunkAvatarId } from '../../models/user.model';

export interface SteampunkAvatarMeta {
  id: SteampunkAvatarId;
  name: string;
  title: string;
  tagline: string;
  accentColor: string;
  glowColor: number;
}

export const STEAMPUNK_AVATARS: SteampunkAvatarMeta[] = [
  {
    id: 'automaton',
    name: 'KRONOS-IV',
    title: 'Autómata de Latón',
    tagline: 'Unidad relojera a cuerda con caldera interna y visor óptico ámbar.',
    accentColor: '#e59a42',
    glowColor: 0xff9d2e,
  },
  {
    id: 'aviator',
    name: 'VALERIA VEX',
    title: 'Aviadora de Éter',
    tagline: 'Piloto de dirigible estratosférico con turbinas dorsales y antiparras.',
    accentColor: '#5ec8e5',
    glowColor: 0x4dd0e1,
  },
  {
    id: 'alchemist',
    name: 'DR. CORVUS',
    title: 'Alquimista de Vapor',
    tagline: 'Erudito hermético con máscara de pico de bronce y matraz etéreo.',
    accentColor: '#66d98c',
    glowColor: 0x4caf50,
  },
  {
    id: 'baron',
    name: 'LORD VANE',
    title: 'Barón Mecánico',
    tagline: 'Aristócrata industrial con galera de escape, monóculo óptico y bigote imperial.',
    accentColor: '#e2b857',
    glowColor: 0xffca28,
  },
  {
    id: 'engineer',
    name: 'IGNIS FORGE',
    title: 'Ingeniera de Forja',
    tagline: 'Maestra soldadora con escafandra térmica de cíclope y llave orbital.',
    accentColor: '#ff7043',
    glowColor: 0xff5722,
  },
  {
    id: 'diver',
    name: 'NAUTILUS-7',
    title: 'Buzo Abisal',
    tagline: 'Explorador de fosas oceánicas en escafandra remachada de cobre presurizado.',
    accentColor: '#4db6ac',
    glowColor: 0x26c6da,
  },
];

export function getAvatarMeta(id?: SteampunkAvatarId): SteampunkAvatarMeta {
  return (
    STEAMPUNK_AVATARS.find((a) => a.id === id) ?? STEAMPUNK_AVATARS[0]
  );
}

/**
 * Generates a crunchy 16x16 PlayStation 1 style Bayer-dithered & riveted texture
 * using NearestFilter so low-poly facets have authentic PSX texel grit.
 */
const textureCache = new Map<string, THREE.DataTexture>();

function createPsxPixelTexture(
  baseHex: number,
  secondaryHex: number,
  pattern: 'dither' | 'rivets' | 'stripes' | 'cloth' = 'dither'
): THREE.DataTexture {
  const key = `${baseHex}-${secondaryHex}-${pattern}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const size = 16;
  const data = new Uint8Array(size * size * 4);
  const c1 = new THREE.Color(baseHex);
  const c2 = new THREE.Color(secondaryHex);

  const bayer4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let mix = 0;

      if (pattern === 'dither') {
        const threshold = bayer4[y % 4][x % 4] / 16;
        mix = threshold > 0.55 ? 0.25 : 0.0;
      } else if (pattern === 'rivets') {
        const isBorder = x === 0 || y === 0 || x === size - 1 || y === size - 1;
        const isRivet =
          (x === 2 || x === size - 3) && (y === 2 || y === size - 3);
        mix = isRivet ? 0.85 : isBorder ? 0.45 : (bayer4[y % 4][x % 4] / 16) * 0.15;
      } else if (pattern === 'stripes') {
        mix = (x + y) % 4 === 0 ? 0.5 : 0.0;
      } else if (pattern === 'cloth') {
        mix = (x % 2 === 0) !== (y % 2 === 0) ? 0.22 : 0.0;
      }

      const r = Math.round(THREE.MathUtils.lerp(c1.r, c2.r, mix) * 255);
      const g = Math.round(THREE.MathUtils.lerp(c1.g, c2.g, mix) * 255);
      const b = Math.round(THREE.MathUtils.lerp(c1.b, c2.b, mix) * 255);

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Applies authentic PlayStation 1 (PSX) vertex snapping to low-poly materials
 */
function createPsxMaterial(options: {
  color: number;
  secondaryColor?: number;
  pattern?: 'dither' | 'rivets' | 'stripes' | 'cloth';
  metalness?: number;
  roughness?: number;
  emissive?: number;
  emissiveIntensity?: number;
}): THREE.MeshStandardMaterial {
  const tex = createPsxPixelTexture(
    options.color,
    options.secondaryColor ?? 0x1a120b,
    options.pattern ?? 'dither'
  );

  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    flatShading: true,
    metalness: options.metalness ?? 0.45,
    roughness: options.roughness ?? 0.65,
    emissive: options.emissive !== undefined ? new THREE.Color(options.emissive) : undefined,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  });

  // Subtle PS1 vertex snapping in clip space
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `
      vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
      gl_Position = projectionMatrix * mvPosition;
      // PSX vertex grid snap
      float snapRes = 56.0;
      gl_Position.xy = floor(gl_Position.xy / gl_Position.w * snapRes + 0.5) / snapRes * gl_Position.w;
      `
    );
  };

  return mat;
}

/**
 * Creates a low-poly cogwheel mesh for steampunk embellishments
 */
function createLowPolyGear(
  radius: number,
  thickness: number,
  teethCount: number,
  material: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  const disk = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, thickness, teethCount),
    material
  );
  disk.rotation.x = Math.PI / 2;
  group.add(disk);

  const toothGeo = new THREE.BoxGeometry(
    radius * 0.28,
    radius * 0.32,
    thickness * 0.92
  );
  for (let i = 0; i < teethCount; i++) {
    const angle = (i / teethCount) * Math.PI * 2;
    const tooth = new THREE.Mesh(toothGeo, material);
    tooth.position.set(
      Math.cos(angle) * radius * 0.88,
      Math.sin(angle) * radius * 0.88,
      0
    );
    tooth.rotation.z = angle - Math.PI / 2;
    group.add(tooth);
  }
  return group;
}

export interface AnimatedAvatarRig {
  root: THREE.Group;
  updateIdle: (elapsed: number, hoverBoost?: number) => void;
}

/**
 * Builds one of the 6 low-poly PSX Steampunk 3D character rigs with its own
 * custom idle animation loop.
 */
export function buildSteampunkAvatarRig(
  avatarId: SteampunkAvatarId
): AnimatedAvatarRig {
  switch (avatarId) {
    case 'automaton':
      return buildAutomatonRig();
    case 'aviator':
      return buildAviatorRig();
    case 'alchemist':
      return buildAlchemistRig();
    case 'baron':
      return buildBaronRig();
    case 'engineer':
      return buildEngineerRig();
    case 'diver':
      return buildDiverRig();
    default:
      return buildAutomatonRig();
  }
}

/* ==========================================================================
   1. KRONOS-IV — Autómata de Latón
   ========================================================================== */
function buildAutomatonRig(): AnimatedAvatarRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const brassMat = createPsxMaterial({
    color: 0xd49442,
    secondaryColor: 0x6e4214,
    pattern: 'rivets',
    metalness: 0.72,
    roughness: 0.42,
  });
  const darkIronMat = createPsxMaterial({
    color: 0x3b322c,
    secondaryColor: 0x17120e,
    pattern: 'rivets',
    metalness: 0.65,
    roughness: 0.55,
  });
  const copperMat = createPsxMaterial({
    color: 0xc8643c,
    secondaryColor: 0x5c2612,
    pattern: 'stripes',
    metalness: 0.68,
    roughness: 0.45,
  });
  const visorMat = createPsxMaterial({
    color: 0xffb300,
    secondaryColor: 0xff6f00,
    pattern: 'stripes',
    emissive: 0xff8f00,
    emissiveIntensity: 1.6,
  });
  const steamMat = createPsxMaterial({
    color: 0xdfd3c3,
    secondaryColor: 0x9c8c79,
    pattern: 'dither',
    roughness: 0.9,
    metalness: 0.05,
  });

  // Torso (faceted boiler chest)
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.52, 0.9, 6),
    brassMat
  );
  torso.position.y = -0.78;
  bodyGroup.add(torso);

  // Shoulder pauldrons (low-poly domes)
  const leftPauldron = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.32, 0),
    copperMat
  );
  leftPauldron.position.set(-0.72, -0.45, 0);
  bodyGroup.add(leftPauldron);

  const rightPauldron = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.32, 0),
    copperMat
  );
  rightPauldron.position.set(0.72, -0.45, 0);
  bodyGroup.add(rightPauldron);

  // Chest clockwork gear
  const chestGear = createLowPolyGear(0.34, 0.12, 8, darkIronMat);
  chestGear.position.set(0, -0.72, 0.58);
  bodyGroup.add(chestGear);

  // Shoulder steam chimney
  const chimney = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.14, 0.65, 5),
    darkIronMat
  );
  chimney.position.set(-0.55, 0.02, -0.25);
  chimney.rotation.z = 0.2;
  bodyGroup.add(chimney);

  // Steam puffs rising from chimney
  const puffs: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const puff = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.11 - i * 0.02, 0),
      steamMat
    );
    puff.position.set(-0.62, 0.4 + i * 0.25, -0.25);
    bodyGroup.add(puff);
    puffs.push(puff);
  }

  // Wind-up key on back/side
  const windupKey = new THREE.Group();
  windupKey.position.set(0.55, -0.1, -0.35);
  windupKey.rotation.y = -0.5;
  const keyShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.45, 5),
    copperMat
  );
  keyShaft.rotation.z = Math.PI / 2;
  windupKey.add(keyShaft);
  const keyRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.055, 4, 6),
    brassMat
  );
  keyRing.position.x = 0.28;
  windupKey.add(keyRing);
  bodyGroup.add(windupKey);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.18;
  bodyGroup.add(headGroup);

  // Faceted cylindrical skull
  const cranium = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.56, 0.78, 7),
    brassMat
  );
  cranium.position.y = 0.22;
  headGroup.add(cranium);

  // Top dome cap + bolt
  const dome = new THREE.Mesh(
    new THREE.ConeGeometry(0.52, 0.28, 7),
    copperMat
  );
  dome.position.y = 0.74;
  headGroup.add(dome);

  // Glowing Visor Housing
  const visorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.26, 0.35),
    darkIronMat
  );
  visorFrame.position.set(0, 0.26, 0.42);
  headGroup.add(visorFrame);

  const visorGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.14, 0.38),
    visorMat
  );
  visorGlow.position.set(0, 0.26, 0.43);
  headGroup.add(visorGlow);

  // Side antenna / pressureears
  const leftEar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.2, 6),
    darkIronMat
  );
  leftEar.rotation.z = Math.PI / 2;
  leftEar.position.set(-0.56, 0.24, 0);
  headGroup.add(leftEar);

  const rightEar = leftEar.clone();
  rightEar.position.x = 0.56;
  headGroup.add(rightEar);

  // Articulated Jaw
  const jawGroup = new THREE.Group();
  jawGroup.position.set(0, -0.15, 0.12);
  const jawMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.24, 0.56),
    darkIronMat
  );
  jawMesh.position.set(0, -0.05, 0.18);
  jawGroup.add(jawMesh);
  headGroup.add(jawGroup);

  return {
    root,
    updateIdle: (elapsed, boost = 1) => {
      const t = elapsed * boost;
      // Mechanical breathing / piston bob
      bodyGroup.position.y = Math.sin(t * 2.6) * 0.055;
      bodyGroup.rotation.y = Math.sin(t * 0.85) * 0.32;

      // Stepped robotic head scan
      const scanWave = Math.sin(t * 1.5);
      headGroup.rotation.y = Math.round(scanWave * 4) / 4 * 0.38 + scanWave * 0.15;
      headGroup.rotation.z = Math.sin(t * 2.1) * 0.06;
      headGroup.rotation.x = Math.cos(t * 1.8) * 0.07;

      // Chattering mechanical jaw
      jawGroup.rotation.x = Math.abs(Math.sin(t * 5.2)) * 0.18;

      // Continuous clockwork gear & wind-up key rotation
      chestGear.rotation.z = t * 1.8;
      windupKey.rotation.x = t * 2.8;

      // Pulsing optical visor
      visorMat.emissiveIntensity = 1.3 + Math.sin(t * 6.0) * 0.45;

      // Rising low-poly steam puffs
      puffs.forEach((puff, idx) => {
        const cycle = (t * 0.9 + idx * 0.33) % 1;
        puff.position.y = 0.36 + cycle * 0.65;
        puff.position.x = -0.6 + Math.sin(t * 3 + idx) * 0.06;
        const s = Math.sin(cycle * Math.PI);
        puff.scale.setScalar(Math.max(0.01, s));
        puff.rotation.y = t * 2 + idx;
      });
    },
  };
}

/* ==========================================================================
   2. VALERIA VEX — Aviadora de Éter
   ========================================================================== */
function buildAviatorRig(): AnimatedAvatarRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const leatherMat = createPsxMaterial({
    color: 0x6e3b23,
    secondaryColor: 0x36190c,
    pattern: 'dither',
    roughness: 0.72,
    metalness: 0.2,
  });
  const skinMat = createPsxMaterial({
    color: 0xe3b48e,
    secondaryColor: 0xb8815b,
    pattern: 'dither',
    roughness: 0.75,
    metalness: 0.1,
  });
  const brassMat = createPsxMaterial({
    color: 0xdba04b,
    secondaryColor: 0x784f18,
    pattern: 'rivets',
    metalness: 0.75,
    roughness: 0.35,
  });
  const scarfMat = createPsxMaterial({
    color: 0xc9382e,
    secondaryColor: 0x6e140e,
    pattern: 'cloth',
    roughness: 0.8,
    metalness: 0.1,
  });
  const lensMat = createPsxMaterial({
    color: 0x4dd0e1,
    secondaryColor: 0x00838f,
    pattern: 'stripes',
    emissive: 0x26c6da,
    emissiveIntensity: 1.25,
  });

  // Flight Jacket Torso
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.46, 0.88, 6),
    leatherMat
  );
  torso.position.y = -0.78;
  bodyGroup.add(torso);

  // Fur/Sheepskin Collar
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.15, 5, 7),
    scarfMat
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = -0.34;
  bodyGroup.add(collar);

  // Articulated Waving Scarf Segments
  const scarfSegments: THREE.Mesh[] = [];
  const scarfRoot = new THREE.Group();
  scarfRoot.position.set(0.35, -0.36, 0.15);
  bodyGroup.add(scarfRoot);

  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.12, 0.22 - i * 0.03),
      scarfMat
    );
    seg.position.set(i * 0.22, -i * 0.06, -i * 0.05);
    scarfRoot.add(seg);
    scarfSegments.push(seg);
  }

  // Dorsal Aether Propeller on Back
  const propellerGroup = new THREE.Group();
  propellerGroup.position.set(0, -0.58, -0.58);
  const propHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.2, 6),
    brassMat
  );
  propHub.rotation.x = Math.PI / 2;
  propellerGroup.add(propHub);

  const bladeGeo = new THREE.BoxGeometry(0.95, 0.14, 0.04);
  const blade1 = new THREE.Mesh(bladeGeo, brassMat);
  const blade2 = new THREE.Mesh(bladeGeo, brassMat);
  blade2.rotation.z = Math.PI / 2;
  propellerGroup.add(blade1, blade2);
  bodyGroup.add(propellerGroup);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.18;
  bodyGroup.add(headGroup);

  // Low-poly sculpted head
  const headMesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.48, 0),
    skinMat
  );
  headMesh.position.y = 0.14;
  headGroup.add(headMesh);

  // Leather Aviator Helmet Dome
  const helmetCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.53, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.62),
    leatherMat
  );
  helmetCap.position.y = 0.2;
  headGroup.add(helmetCap);

  // Ear Flaps
  const earFlapGeo = new THREE.BoxGeometry(0.14, 0.42, 0.32);
  const leftFlap = new THREE.Mesh(earFlapGeo, leatherMat);
  leftFlap.position.set(-0.5, 0.06, 0.02);
  leftFlap.rotation.z = 0.15;
  const rightFlap = leftFlap.clone();
  rightFlap.position.x = 0.5;
  rightFlap.rotation.z = -0.15;
  headGroup.add(leftFlap, rightFlap);

  // Twin Steampunk Brass & Cyan Goggles
  const gogglesGroup = new THREE.Group();
  gogglesGroup.position.set(0, 0.24, 0.42);
  headGroup.add(gogglesGroup);

  const leftRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.18, 7),
    brassMat
  );
  leftRim.rotation.x = Math.PI / 2;
  leftRim.position.set(-0.21, 0, 0);

  const leftLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.2, 7),
    lensMat
  );
  leftLens.rotation.x = Math.PI / 2;
  leftLens.position.set(-0.21, 0, 0.01);

  const rightRim = leftRim.clone();
  rightRim.position.x = 0.21;
  const rightLens = leftLens.clone();
  rightLens.position.x = 0.21;

  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.07, 0.12),
    brassMat
  );
  gogglesGroup.add(leftRim, leftLens, rightRim, rightLens, bridge);

  return {
    root,
    updateIdle: (elapsed, boost = 1) => {
      const t = elapsed * boost;
      // Agile aviator breathing & sway
      bodyGroup.position.y = Math.sin(t * 2.2) * 0.06;
      bodyGroup.rotation.y = Math.sin(t * 0.9) * 0.35;
      bodyGroup.rotation.z = Math.cos(t * 1.4) * 0.04;

      // Confident head look-around & banking tilt
      headGroup.rotation.y = Math.sin(t * 1.35) * 0.34;
      headGroup.rotation.z = Math.sin(t * 1.9) * 0.11;
      headGroup.rotation.x = Math.sin(t * 2.2) * 0.08;

      // Goggles subtle bob
      gogglesGroup.position.y = 0.24 + Math.sin(t * 4.4) * 0.015;

      // Waving scarf in the slipstream
      scarfSegments.forEach((seg, i) => {
        seg.position.y = -i * 0.05 + Math.sin(t * 5.2 - i * 0.85) * 0.07;
        seg.position.z = -i * 0.05 + Math.cos(t * 4.2 - i * 0.7) * 0.06;
        seg.rotation.z = Math.sin(t * 5.2 - i * 0.6) * 0.22;
      });

      // Fast spinning dorsal propeller
      propellerGroup.rotation.z = t * 7.5;
    },
  };
}

/* ==========================================================================
   3. DR. CORVUS — Alquimista de Vapor
   ========================================================================== */
function buildAlchemistRig(): AnimatedAvatarRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const cloakMat = createPsxMaterial({
    color: 0x262129,
    secondaryColor: 0x110e14,
    pattern: 'cloth',
    roughness: 0.82,
    metalness: 0.15,
  });
  const beakMat = createPsxMaterial({
    color: 0x9c7a4c,
    secondaryColor: 0x4a371d,
    pattern: 'rivets',
    metalness: 0.55,
    roughness: 0.48,
  });
  const brassMat = createPsxMaterial({
    color: 0xc99649,
    secondaryColor: 0x614317,
    pattern: 'rivets',
    metalness: 0.72,
    roughness: 0.38,
  });
  const alchGreenMat = createPsxMaterial({
    color: 0x4caf50,
    secondaryColor: 0x00e676,
    pattern: 'stripes',
    emissive: 0x2e7d32,
    emissiveIntensity: 1.75,
  });

  // Cloak Torso & High Collar
  const torso = new THREE.Mesh(
    new THREE.ConeGeometry(0.75, 1.05, 6),
    cloakMat
  );
  torso.position.y = -0.78;
  bodyGroup.add(torso);

  // Brass Mantle Ring
  const mantle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.68, 0.25, 6),
    brassMat
  );
  mantle.position.y = -0.35;
  bodyGroup.add(mantle);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.15;
  bodyGroup.add(headGroup);

  // Hood / Cranium
  const cranium = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5, 1),
    cloakMat
  );
  cranium.position.y = 0.18;
  headGroup.add(cranium);

  // Iconic Faceted Plague Beak Mask
  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.82, 5),
    beakMat
  );
  beak.rotation.x = Math.PI / 2 + 0.22;
  beak.position.set(0, 0.08, 0.62);
  headGroup.add(beak);

  // Glowing Emerald Alchemical Lenses
  const eyeGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.16, 6);
  const leftEye = new THREE.Mesh(eyeGeo, alchGreenMat);
  leftEye.rotation.x = Math.PI / 2;
  leftEye.position.set(-0.22, 0.24, 0.42);
  leftEye.rotation.z = -0.2;

  const rightEye = leftEye.clone();
  rightEye.position.x = 0.22;
  rightEye.rotation.z = 0.2;
  headGroup.add(leftEye, rightEye);

  // Wide-brimmed Alchemist Hat
  const hatBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.86, 0.86, 0.07, 7),
    cloakMat
  );
  hatBrim.position.y = 0.52;
  hatBrim.rotation.z = -0.06;
  headGroup.add(hatBrim);

  const hatCrown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.48, 0.45, 7),
    cloakMat
  );
  hatCrown.position.y = 0.75;
  headGroup.add(hatCrown);

  // Glowing Vial Strapped to Hat
  const hatVial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.26, 5),
    alchGreenMat
  );
  hatVial.position.set(0.42, 0.68, 0.15);
  hatVial.rotation.z = 0.25;
  headGroup.add(hatVial);

  // Floating Alchemical Flask orbiting near chest/shoulder
  const flaskGroup = new THREE.Group();
  flaskGroup.position.set(0.68, -0.15, 0.42);
  const flaskBulb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22, 0),
    alchGreenMat
  );
  const flaskNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 0.2, 5),
    brassMat
  );
  flaskNeck.position.y = 0.2;
  flaskGroup.add(flaskBulb, flaskNeck);
  root.add(flaskGroup);

  return {
    root,
    updateIdle: (elapsed, boost = 1) => {
      const t = elapsed * boost;
      // Mysterious slow breathing & sway
      bodyGroup.position.y = Math.sin(t * 1.9) * 0.05;
      bodyGroup.rotation.y = Math.sin(t * 0.75) * 0.34;

      // Crow-like inquisitive head tilts (roll + yaw)
      headGroup.rotation.y = Math.sin(t * 1.2) * 0.32;
      headGroup.rotation.z = Math.sin(t * 1.75) * 0.16;
      headGroup.rotation.x = Math.cos(t * 1.4) * 0.09;

      // Floating alchemical flask levitation & spin
      flaskGroup.position.y = -0.12 + Math.sin(t * 3.1) * 0.14;
      flaskGroup.position.x = 0.64 + Math.cos(t * 1.6) * 0.08;
      flaskGroup.rotation.y = t * 2.2;
      flaskGroup.rotation.z = Math.sin(t * 2.5) * 0.25;

      // Pulsing emerald luminescence
      alchGreenMat.emissiveIntensity = 1.4 + Math.sin(t * 4.5) * 0.55;
    },
  };
}

/* ==========================================================================
   4. LORD VANE — Barón Mecánico
   ========================================================================== */
function buildBaronRig(): AnimatedAvatarRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const suitMat = createPsxMaterial({
    color: 0x3d2228,
    secondaryColor: 0x1c0d10,
    pattern: 'cloth',
    roughness: 0.7,
    metalness: 0.15,
  });
  const brassMat = createPsxMaterial({
    color: 0xe0a94f,
    secondaryColor: 0x7a5214,
    pattern: 'rivets',
    metalness: 0.78,
    roughness: 0.32,
  });
  const hatMat = createPsxMaterial({
    color: 0x1e1916,
    secondaryColor: 0x0a0807,
    pattern: 'stripes',
    roughness: 0.6,
    metalness: 0.25,
  });
  const skinMat = createPsxMaterial({
    color: 0xdcb08a,
    secondaryColor: 0xa67953,
    pattern: 'dither',
    roughness: 0.72,
    metalness: 0.1,
  });
  const mustacheMat = createPsxMaterial({
    color: 0x4a3222,
    secondaryColor: 0x24160d,
    pattern: 'stripes',
    roughness: 0.8,
  });
  const monocleMat = createPsxMaterial({
    color: 0xffd54f,
    secondaryColor: 0xff8f00,
    pattern: 'dither',
    emissive: 0xffb300,
    emissiveIntensity: 1.5,
  });

  // Aristocratic Coat Torso
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.48, 0.9, 6),
    suitMat
  );
  torso.position.y = -0.78;
  bodyGroup.add(torso);

  // Brass lapels / waistcoat center
  const waistcoat = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.75, 0.52),
    brassMat
  );
  waistcoat.position.set(0, -0.74, 0.32);
  bodyGroup.add(waistcoat);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.08;
  bodyGroup.add(headGroup);

  const headMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.4, 0.65, 7),
    skinMat
  );
  headMesh.position.y = 0.14;
  headGroup.add(headMesh);

  // Glowing Mechanical Monocle (Right Eye)
  const monocleGroup = new THREE.Group();
  monocleGroup.position.set(0.2, 0.22, 0.42);
  const monocleRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.12, 7),
    brassMat
  );
  monocleRim.rotation.x = Math.PI / 2;
  const monocleLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.14, 7),
    monocleMat
  );
  monocleLens.rotation.x = Math.PI / 2;
  monocleGroup.add(monocleRim, monocleLens);
  headGroup.add(monocleGroup);

  // Left Eye (dark low-poly socket)
  const leftEye = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.08, 0.1),
    hatMat
  );
  leftEye.position.set(-0.18, 0.22, 0.41);
  headGroup.add(leftEye);

  // Articulated Imperial Handlebar Mustache
  const mustacheGroup = new THREE.Group();
  mustacheGroup.position.set(0, 0.0, 0.44);
  headGroup.add(mustacheGroup);

  const leftStache = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.48, 5),
    mustacheMat
  );
  leftStache.rotation.z = Math.PI / 2 + 0.25;
  leftStache.position.set(-0.22, 0.02, 0);

  const rightStache = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.48, 5),
    mustacheMat
  );
  rightStache.rotation.z = -Math.PI / 2 - 0.25;
  rightStache.position.set(0.22, 0.02, 0);
  mustacheGroup.add(leftStache, rightStache);

  // Tall Stovepipe Top Hat (Galera)
  const hatBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 0.08, 8),
    hatMat
  );
  hatBrim.position.y = 0.48;
  headGroup.add(hatBrim);

  const hatBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.49, 0.49, 0.12, 8),
    brassMat
  );
  hatBand.position.y = 0.56;
  headGroup.add(hatBand);

  const hatCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.47, 0.72, 8),
    hatMat
  );
  hatCylinder.position.y = 0.88;
  headGroup.add(hatCylinder);

  // Clockwork Escapement Gear on the Top Hat
  const hatGear = createLowPolyGear(0.26, 0.08, 8, brassMat);
  hatGear.position.set(-0.32, 0.76, 0.38);
  headGroup.add(hatGear);

  return {
    root,
    updateIdle: (elapsed, boost = 1) => {
      const t = elapsed * boost;
      // Aristocratic chest breathing
      bodyGroup.position.y = Math.sin(t * 2.0) * 0.05;
      bodyGroup.rotation.y = Math.sin(t * 0.8) * 0.34;

      // Haughty head turn & chin lift
      headGroup.rotation.y = Math.sin(t * 1.1) * 0.3;
      headGroup.rotation.x = -0.06 + Math.sin(t * 1.6) * 0.07;
      headGroup.rotation.z = Math.cos(t * 1.3) * 0.06;

      // Expressive handlebar mustache twitch
      const twitch = Math.sin(t * 6.5) * Math.max(0, Math.sin(t * 1.8));
      leftStache.rotation.z = Math.PI / 2 + 0.25 - twitch * 0.22;
      rightStache.rotation.z = -Math.PI / 2 - 0.25 + twitch * 0.22;

      // Monocle focus adjustment
      monocleGroup.position.z = 0.42 + Math.sin(t * 3.0) * 0.03;

      // Clockwork escapement ticking on the top-hat gear
      const tickStep = Math.floor(t * 3.5) + Math.pow( (t * 3.5) % 1, 4 );
      hatGear.rotation.z = -tickStep * (Math.PI / 6);
    },
  };
}

/* ==========================================================================
   5. IGNIS FORGE — Ingeniera de Forja
   ========================================================================== */
function buildEngineerRig(): AnimatedAvatarRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const ironMat = createPsxMaterial({
    color: 0x453c38,
    secondaryColor: 0x1c1715,
    pattern: 'rivets',
    metalness: 0.68,
    roughness: 0.48,
  });
  const copperMat = createPsxMaterial({
    color: 0xd96b38,
    secondaryColor: 0x6e2a0c,
    pattern: 'rivets',
    metalness: 0.72,
    roughness: 0.38,
  });
  const brassMat = createPsxMaterial({
    color: 0xe0a646,
    secondaryColor: 0x734d12,
    pattern: 'stripes',
    metalness: 0.75,
    roughness: 0.35,
  });
  const forgeGlowMat = createPsxMaterial({
    color: 0xff6d00,
    secondaryColor: 0xffab00,
    pattern: 'dither',
    emissive: 0xff3d00,
    emissiveIntensity: 1.8,
  });

  // Heavy Apron/Armor Torso
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.66, 0.54, 0.88, 6),
    ironMat
  );
  torso.position.y = -0.78;
  bodyGroup.add(torso);

  // Glowing Furnace Core Vent on Chest
  const chestVent = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22, 0),
    forgeGlowMat
  );
  chestVent.position.set(0, -0.68, 0.55);
  bodyGroup.add(chestVent);

  // Heavy Riveted Shoulder Pauldrons
  const pauldronGeo = new THREE.DodecahedronGeometry(0.34, 0);
  const leftPauldron = new THREE.Mesh(pauldronGeo, copperMat);
  leftPauldron.position.set(-0.72, -0.42, 0);
  const rightPauldron = new THREE.Mesh(pauldronGeo, copperMat);
  rightPauldron.position.set(0.72, -0.42, 0);
  bodyGroup.add(leftPauldron, rightPauldron);

  // Head Group (Heavy Welding Helmet / Cyclops Visor)
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.16;
  bodyGroup.add(headGroup);

  const domeHelmet = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.56, 0),
    ironMat
  );
  domeHelmet.position.y = 0.2;
  headGroup.add(domeHelmet);

  // Central Magnifying Cyclops Lens
  const cyclopsBezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.36, 0.28, 7),
    brassMat
  );
  cyclopsBezel.rotation.x = Math.PI / 2;
  cyclopsBezel.position.set(0, 0.24, 0.44);
  headGroup.add(cyclopsBezel);

  const cyclopsLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.31, 7),
    forgeGlowMat
  );
  cyclopsLens.rotation.x = Math.PI / 2;
  cyclopsLens.position.set(0, 0.24, 0.45);
  headGroup.add(cyclopsLens);

  // Side Ear-Valves
  const leftValve = createLowPolyGear(0.24, 0.1, 6, copperMat);
  leftValve.rotation.y = Math.PI / 2;
  leftValve.position.set(-0.58, 0.22, 0);
  headGroup.add(leftValve);

  const rightValve = createLowPolyGear(0.24, 0.1, 6, copperMat);
  rightValve.rotation.y = Math.PI / 2;
  rightValve.position.set(0.58, 0.22, 0);
  headGroup.add(rightValve);

  // Orbiting Steampunk Wrench / Arc-Tool
  const wrenchGroup = new THREE.Group();
  wrenchGroup.position.set(-0.72, 0.25, 0.35);
  const wrenchShaft = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.62, 0.08),
    brassMat
  );
  const wrenchJaw = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.06, 4, 5, Math.PI * 1.4),
    copperMat
  );
  wrenchJaw.position.y = 0.34;
  wrenchGroup.add(wrenchShaft, wrenchJaw);
  root.add(wrenchGroup);

  return {
    root,
    updateIdle: (elapsed, boost = 1) => {
      const t = elapsed * boost;
      // Energetic workshop bounce
      bodyGroup.position.y = Math.abs(Math.sin(t * 2.8)) * 0.07 - 0.03;
      bodyGroup.rotation.y = Math.sin(t * 0.95) * 0.35;

      // Inspecting nod & tilt
      headGroup.rotation.y = Math.sin(t * 1.45) * 0.32;
      headGroup.rotation.x = Math.sin(t * 2.8) * 0.12;
      headGroup.rotation.z = Math.cos(t * 1.9) * 0.09;

      // Side ear-valves oscillate
      leftValve.rotation.z = t * 2.4;
      rightValve.rotation.z = -t * 2.4;

      // Floating wrench bob & spin
      wrenchGroup.position.y = 0.22 + Math.sin(t * 3.4) * 0.12;
      wrenchGroup.rotation.z = -0.25 + Math.sin(t * 2.2) * 0.2;
      wrenchGroup.rotation.y = t * 2.1;

      // Flickering forge fire glow
      forgeGlowMat.emissiveIntensity =
        1.5 + Math.sin(t * 7.0) * 0.35 + Math.cos(t * 13.0) * 0.2;
    },
  };
}

/* ==========================================================================
   6. NAUTILUS-7 — Buzo Abisal
   ========================================================================== */
function buildDiverRig(): AnimatedAvatarRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const divingCopperMat = createPsxMaterial({
    color: 0xb8683c,
    secondaryColor: 0x592b12,
    pattern: 'rivets',
    metalness: 0.72,
    roughness: 0.42,
  });
  const brassMat = createPsxMaterial({
    color: 0xd9a14a,
    secondaryColor: 0x6e4b16,
    pattern: 'rivets',
    metalness: 0.76,
    roughness: 0.36,
  });
  const suitMat = createPsxMaterial({
    color: 0x2c3b39,
    secondaryColor: 0x131c1b,
    pattern: 'cloth',
    roughness: 0.78,
    metalness: 0.2,
  });
  const abyssGlowMat = createPsxMaterial({
    color: 0x26c6da,
    secondaryColor: 0x00acc1,
    pattern: 'dither',
    emissive: 0x00bcd4,
    emissiveIntensity: 1.65,
  });
  const bubbleMat = createPsxMaterial({
    color: 0xb2ebf2,
    secondaryColor: 0x4dd0e1,
    pattern: 'dither',
    emissive: 0x26c6da,
    emissiveIntensity: 0.7,
  });

  // Heavy Pressurized Diving Suit Torso
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.58, 0.88, 7),
    suitMat
  );
  torso.position.y = -0.8;
  bodyGroup.add(torso);

  // Heavy Bolted Copper Corselet (Neckplate)
  const corselet = new THREE.Mesh(
    new THREE.ConeGeometry(0.74, 0.4, 7),
    divingCopperMat
  );
  corselet.position.y = -0.35;
  bodyGroup.add(corselet);

  // Bathysphere Diving Helmet (Escafandra)
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.2;
  bodyGroup.add(headGroup);

  const helmetSphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.62, 0),
    divingCopperMat
  );
  helmetSphere.position.y = 0.16;
  headGroup.add(helmetSphere);

  // Front Guarded Porthole
  const frontBezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.22, 8),
    brassMat
  );
  frontBezel.rotation.x = Math.PI / 2;
  frontBezel.position.set(0, 0.18, 0.5);
  headGroup.add(frontBezel);

  const frontGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.29, 0.24, 8),
    abyssGlowMat
  );
  frontGlass.rotation.x = Math.PI / 2;
  frontGlass.position.set(0, 0.18, 0.51);
  headGroup.add(frontGlass);

  // Brass Crossbars over Front Porthole
  const barV = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.62, 0.05),
    brassMat
  );
  barV.position.set(0, 0.18, 0.63);
  const barH = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.05, 0.05),
    brassMat
  );
  barH.position.set(0, 0.18, 0.63);
  headGroup.add(barV, barH);

  // Side Portholes
  const leftPort = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.2, 6),
    brassMat
  );
  leftPort.rotation.z = Math.PI / 2;
  leftPort.position.set(-0.56, 0.18, 0);
  const rightPort = leftPort.clone();
  rightPort.position.x = 0.56;
  headGroup.add(leftPort, rightPort);

  // Rising Abyssal Bubbles / Steam Octahedrons
  const bubbles: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.085 - i * 0.012, 0),
      bubbleMat
    );
    bodyGroup.add(b);
    bubbles.push(b);
  }

  return {
    root,
    updateIdle: (elapsed, boost = 1) => {
      const t = elapsed * boost;
      // Ponderous underwater/pressurized floating sway
      bodyGroup.position.y = Math.sin(t * 1.65) * 0.085;
      bodyGroup.rotation.y = Math.sin(t * 0.7) * 0.36;
      bodyGroup.rotation.z = Math.sin(t * 1.1) * 0.06;

      // Heavy bathysphere helmet scan
      headGroup.rotation.y = Math.sin(t * 1.05) * 0.28;
      headGroup.rotation.x = Math.cos(t * 1.35) * 0.08;

      // Bioluminescent porthole pulse
      abyssGlowMat.emissiveIntensity = 1.35 + Math.sin(t * 3.8) * 0.45;

      // Rising low-poly bubbles around the helmet
      bubbles.forEach((b, idx) => {
        const cycle = (t * 0.65 + idx * 0.25) % 1;
        const side = idx % 2 === 0 ? 1 : -1;
        b.position.x = side * (0.58 + Math.sin(t * 2.5 + idx) * 0.08);
        b.position.y = -0.2 + cycle * 1.15;
        b.position.z = 0.25 + Math.cos(t * 2 + idx) * 0.15;
        b.rotation.y = t * 2.5 + idx;
        b.scale.setScalar(Math.sin(cycle * Math.PI));
      });
    },
  };
}

