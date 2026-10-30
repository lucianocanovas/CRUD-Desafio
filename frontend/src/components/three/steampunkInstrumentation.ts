import * as THREE from 'three';

/* ==========================================================================
   Procedural Textures for 3D Manometer Dial & 3D Nixie Tube Cathodes
   ========================================================================== */

function createGaugeDialTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;

  // Aged dark brass/parchment industrial dial background
  const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, r);
  grad.addColorStop(0, '#291e14');
  grad.addColorStop(0.72, '#17110b');
  grad.addColorStop(1, '#090604');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Inner brass ring
  ctx.strokeStyle = 'rgba(218, 172, 108, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.84, 0, Math.PI * 2);
  ctx.stroke();

  // Danger overpressure zone arc (from +45 deg to +125 deg where 0 deg is up)
  // In canvas arc angles: -90 deg is UP. So angle = (deg - 90) * PI / 180
  const dangerStart = ((45 - 90) * Math.PI) / 180;
  const dangerEnd = ((125 - 90) * Math.PI) / 180;
  ctx.strokeStyle = '#ff5722';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, dangerStart, dangerEnd);
  ctx.stroke();

  // Graduation ticks (-125 deg to +125 deg)
  const totalSteps = 25;
  for (let i = 0; i <= totalSteps; i++) {
    const frac = i / totalSteps;
    const deg = -125 + frac * 250;
    const rad = ((deg - 90) * Math.PI) / 180;
    const isMajor = i % 5 === 0;

    const rOuter = r * 0.83;
    const rInner = r * (isMajor ? 0.66 : 0.74);

    ctx.strokeStyle = deg >= 45 ? '#ff7043' : '#e6be8a';
    ctx.lineWidth = isMajor ? 3.5 : 1.8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * rInner, cy + Math.sin(rad) * rInner);
    ctx.lineTo(cx + Math.cos(rad) * rOuter, cy + Math.sin(rad) * rOuter);
    ctx.stroke();

    if (isMajor) {
      const val = i * 4; // 0 to 100 PSI
      const rText = r * 0.51;
      ctx.fillStyle = deg >= 45 ? '#ff8a65' : '#f3dec0';
      ctx.font = 'bold 18px "Artisual Deco", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        String(val),
        cx + Math.cos(rad) * rText,
        cy + Math.sin(rad) * rText
      );
    }
  }

  // Dial labels
  ctx.fillStyle = '#c8985e';
  ctx.font = 'bold 14px "Artisual Deco", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VAPOR PSI', cx, cy + r * 0.42);

  ctx.fillStyle = 'rgba(200, 152, 94, 0.55)';
  ctx.font = '11px "Artisual Deco", sans-serif';
  ctx.fillText('MANÓMETRO MK-IV', cx, cy + r * 0.62);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const nixieDigitTextures = new Map<string, THREE.CanvasTexture>();

function getNixieDigitTexture(char: string): THREE.CanvasTexture {
  const cached = nixieDigitTextures.get(char);
  if (cached) return cached;

  const w = 128;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  // Subtle metallic cathode mesh grid in background of the tube
  ctx.strokeStyle = 'rgba(120, 70, 35, 0.16)';
  ctx.lineWidth = 1;
  for (let y = 16; y < h - 16; y += 12) {
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(w - 16, y);
    ctx.stroke();
  }

  // Outer warm neon plasma bloom
  ctx.save();
  ctx.font = '600 168px "IBM Plex Mono", "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = '#ff3d00';
  ctx.shadowBlur = 28;
  ctx.fillStyle = 'rgba(255, 87, 34, 0.85)';
  ctx.fillText(char, w / 2, h / 2 + 4);

  // Mid orange neon glow
  ctx.shadowColor = '#ff9100';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ffab40';
  ctx.fillText(char, w / 2, h / 2 + 4);

  // Incandescent bright filament core
  ctx.shadowBlur = 4;
  ctx.fillStyle = '#fff8e1';
  ctx.fillText(char, w / 2, h / 2 + 4);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  nixieDigitTextures.set(char, tex);
  return tex;
}

/* ==========================================================================
   1. 3D Nixie Tube Clock Rig (Bottom-Left Integrated Assembly)
   ========================================================================== */

export interface NixieClock3DRig {
  group: THREE.Group;
  triggerPurge: () => void;
  update: (elapsed: number, delta: number) => void;
}

export function createNixieClock3D(): NixieClock3DRig {
  const group = new THREE.Group();

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd49b4b,
    metalness: 0.78,
    roughness: 0.32,
    flatShading: true,
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xc86438,
    metalness: 0.72,
    roughness: 0.38,
    flatShading: true,
  });

  const darkIronMat = new THREE.MeshStandardMaterial({
    color: 0x241c16,
    metalness: 0.62,
    roughness: 0.55,
    flatShading: true,
  });

  const bakeliteMat = new THREE.MeshStandardMaterial({
    color: 0x160e09,
    metalness: 0.25,
    roughness: 0.7,
    flatShading: true,
  });

  const glassEnvelopeMat = new THREE.MeshPhysicalMaterial({
    color: 0xffdfb8,
    transparent: true,
    opacity: 0.22,
    roughness: 0.12,
    metalness: 0.1,
    reflectivity: 0.9,
    depthWrite: false,
  });

  // Heavy Riveted Base Chassis
  const chassisWidth = 3.25;
  const chassisHeight = 0.34;
  const chassisDepth = 0.82;

  const baseBox = new THREE.Mesh(
    new THREE.BoxGeometry(chassisWidth, chassisHeight, chassisDepth),
    darkIronMat
  );
  baseBox.position.y = -0.58;
  group.add(baseBox);

  // Brass Top Plate & Bezel Trim
  const topPlate = new THREE.Mesh(
    new THREE.BoxGeometry(chassisWidth + 0.1, 0.08, chassisDepth + 0.08),
    brassMat
  );
  topPlate.position.y = -0.39;
  group.add(topPlate);

  // Front Brass Nameplate
  const frontPlaque = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.16, 0.06),
    brassMat
  );
  frontPlaque.position.set(0, -0.58, chassisDepth / 2 + 0.02);
  group.add(frontPlaque);

  // Corner Bolts on Chassis
  const boltGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 6);
  [-1.52, 1.52].forEach((bx) => {
    [-0.32, 0.32].forEach((bz) => {
      const bolt = new THREE.Mesh(boltGeo, copperMat);
      bolt.position.set(bx, -0.34, bz);
      group.add(bolt);
    });
  });

  // Background Feeder Pipe connecting the clock into the background wall/floor
  const feederPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 2.2, 8),
    copperMat
  );
  feederPipe.position.set(-1.35, -0.55, -0.9);
  feederPipe.rotation.x = Math.PI / 2;
  group.add(feederPipe);

  // 6 Nixie Tubes (HH : MM : SS)
  const tubeXPositions = [-1.26, -0.82, -0.22, 0.22, 0.82, 1.26];
  const digitMaterials: THREE.MeshBasicMaterial[] = [];
  const currentChars: string[] = ['0', '0', '0', '0', '0', '0'];

  for (let i = 0; i < 6; i++) {
    const tx = tubeXPositions[i];
    const tubeGroup = new THREE.Group();
    tubeGroup.position.set(tx, -0.35, 0);
    group.add(tubeGroup);

    // Bakelite & Brass Collar Socket
    const socketBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, 0.16, 10),
      bakeliteMat
    );
    socketBase.position.y = 0.08;
    tubeGroup.add(socketBase);

    const brassCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.21, 0.05, 10),
      brassMat
    );
    brassCollar.position.y = 0.16;
    tubeGroup.add(brassCollar);

    // Ghost background unlit cathode stack
    const ghostPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.62),
      new THREE.MeshBasicMaterial({
        map: getNixieDigitTexture('8'),
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      })
    );
    ghostPlane.position.set(0, 0.5, -0.03);
    tubeGroup.add(ghostPlane);

    // Active Glowing Neon Cathode Digit Plane
    const digitMat = new THREE.MeshBasicMaterial({
      map: getNixieDigitTexture('0'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const digitPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 0.68),
      digitMat
    );
    digitPlane.position.set(0, 0.5, 0.02);
    tubeGroup.add(digitPlane);
    digitMaterials.push(digitMat);

    // Outer Glass Vacuum Cylinder + Dome
    const glassBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.68, 12, 1, true),
      glassEnvelopeMat
    );
    glassBody.position.y = 0.5;
    tubeGroup.add(glassBody);

    const glassDome = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.19,
        12,
        8,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.5
      ),
      glassEnvelopeMat
    );
    glassDome.position.y = 0.84;
    tubeGroup.add(glassDome);

    // Exhaust tip nipple on top of the glass tube
    const glassTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.09, 6),
      glassEnvelopeMat
    );
    glassTip.position.y = 1.05;
    tubeGroup.add(glassTip);
  }

  // 2 Pulsing Neon Colon Separators (between HH:MM and MM:SS)
  const colonMat = new THREE.MeshStandardMaterial({
    color: 0xff9100,
    emissive: new THREE.Color(0xff5722),
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });

  const colonPositions = [-0.52, 0.52];
  const colonDots: THREE.Mesh[] = [];
  colonPositions.forEach((cx) => {
    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.55, 6),
      brassMat
    );
    stand.position.set(cx, -0.08, 0);
    group.add(stand);

    [0.02, 0.26].forEach((cy) => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 8, 8),
        colonMat
      );
      dot.position.set(cx, cy, 0.05);
      group.add(dot);
      colonDots.push(dot);
    });
  });

  // Warm Neon PointLight illuminating the Nixie tubes and brass base
  const nixieLight = new THREE.PointLight(0xff7722, 3.2, 4.5, 1.5);
  nixieLight.position.set(0, 0.25, 0.65);
  group.add(nixieLight);

  let purgeTimer = 0;

  return {
    group,
    triggerPurge: () => {
      purgeTimer = 0.85;
    },
    update: (elapsed, delta) => {
      if (purgeTimer > 0) {
        purgeTimer = Math.max(0, purgeTimer - delta);
      }

      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const targetStr = `${hh}${mm}${ss}`;

      for (let i = 0; i < 6; i++) {
        let ch = targetStr[i];
        if (purgeTimer > 0) {
          // Rapid cathode depolarization roll
          const rollDigit = Math.floor(elapsed * 28 + i * 2) % 10;
          ch = String(rollDigit);
        }
        if (currentChars[i] !== ch) {
          currentChars[i] = ch;
          digitMaterials[i].map = getNixieDigitTexture(ch);
          digitMaterials[i].needsUpdate = true;
        }
      }

      // Pulse colon neon bulbs each second + subtle plasma flicker
      const secFrac = (now.getMilliseconds() / 1000) * Math.PI * 2;
      const pulse = 0.55 + 0.45 * Math.cos(secFrac);
      colonMat.emissiveIntensity = 1.1 + pulse * 1.8;

      const flicker =
        1.0 + Math.sin(elapsed * 37) * 0.03 + Math.cos(elapsed * 19) * 0.02;
      nixieLight.intensity = (purgeTimer > 0 ? 4.8 : 3.0) * flicker;
    },
  };
}

/* ==========================================================================
   2. 3D Steam Valve & 3D Analog Pressure Gauge Rig (Bottom-Right Integrated)
   ========================================================================== */

export interface ValveGauge3DRig {
  group: THREE.Group;
  valveWheelGroup: THREE.Group;
  setHolding: (holding: boolean) => void;
  triggerBurst: () => void;
  getPressure: () => number;
  update: (elapsed: number, delta: number) => void;
}

export function createValveAndGauge3D(
  onBoostTrigger?: () => void
): ValveGauge3DRig {
  const group = new THREE.Group();

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xdca04c,
    metalness: 0.8,
    roughness: 0.28,
    flatShading: true,
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xc86438,
    metalness: 0.74,
    roughness: 0.36,
    flatShading: true,
  });

  const darkIronMat = new THREE.MeshStandardMaterial({
    color: 0x261e18,
    metalness: 0.65,
    roughness: 0.52,
    flatShading: true,
  });

  const valveRedMat = new THREE.MeshStandardMaterial({
    color: 0xb83b24,
    metalness: 0.48,
    roughness: 0.42,
    flatShading: true,
  });

  const needleMat = new THREE.MeshStandardMaterial({
    color: 0xffd54f,
    emissive: new THREE.Color(0xff6f00),
    emissiveIntensity: 0.65,
    metalness: 0.5,
    roughness: 0.3,
  });

  const glassCoverMat = new THREE.MeshPhysicalMaterial({
    color: 0xfff3e0,
    transparent: true,
    opacity: 0.2,
    roughness: 0.1,
    metalness: 0.1,
    depthWrite: false,
  });

  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xff5722,
    emissive: new THREE.Color(0xff3d00),
    emissiveIntensity: 0.4,
    roughness: 0.25,
  });

  const steamPuffMat = new THREE.MeshStandardMaterial({
    color: 0xe6dacb,
    transparent: true,
    opacity: 0.75,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  });

  // -------------------------------------------------------------------------
  // A. Heavy Copper Manifold Pipe Bridge connecting Gauge, Valve & Background
  // -------------------------------------------------------------------------
  const horizontalPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 1.9, 8),
    copperMat
  );
  horizontalPipe.rotation.z = Math.PI / 2;
  horizontalPipe.position.set(0, -0.1, -0.15);
  group.add(horizontalPipe);

  // Flanges on horizontal pipe
  [-0.35, 0.35].forEach((fx) => {
    const flange = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.08, 8),
      brassMat
    );
    flange.rotation.z = Math.PI / 2;
    flange.position.set(fx, -0.1, -0.15);
    group.add(flange);
  });

  // Vertical exhaust/intake pipe descending into the bottom frame
  const verticalPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.2, 1.2, 8),
    darkIronMat
  );
  verticalPipe.position.set(0, -0.68, -0.15);
  group.add(verticalPipe);

  // Steam Relief Nozzle on top of the pipe bridge
  const reliefNozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 0.28, 7),
    brassMat
  );
  reliefNozzle.position.set(0, 0.12, -0.12);
  group.add(reliefNozzle);

  // 3D Low-Poly Steam Puff Particles erupting from Relief Nozzle
  const steamPuffs: {
    mesh: THREE.Mesh;
    age: number;
    speedY: number;
    driftX: number;
  }[] = [];

  for (let i = 0; i < 6; i++) {
    const puffMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.13, 0),
      steamPuffMat
    );
    puffMesh.visible = false;
    group.add(puffMesh);
    steamPuffs.push({
      mesh: puffMesh,
      age: 99,
      speedY: 1.1 + (i % 3) * 0.35,
      driftX: ((i % 2 === 0 ? 1 : -1) * (i + 1)) * 0.08,
    });
  }

  // -------------------------------------------------------------------------
  // B. 3D Analog Pressure Gauge (Left side of assembly: x = -0.82)
  // -------------------------------------------------------------------------
  const gaugeGroup = new THREE.Group();
  gaugeGroup.position.set(-0.82, 0.06, 0);
  gaugeGroup.rotation.y = 0;
  group.add(gaugeGroup);

  // Cylindrical Brass Casing
  const gaugeBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.66, 0.68, 0.28, 14),
    darkIronMat
  );
  gaugeBody.rotation.x = Math.PI / 2;
  gaugeGroup.add(gaugeBody);

  // Beveled Outer Brass Bezel Ring
  const gaugeBezel = new THREE.Mesh(
    new THREE.TorusGeometry(0.64, 0.075, 8, 16),
    brassMat
  );
  gaugeBezel.position.z = 0.12;
  gaugeGroup.add(gaugeBezel);

  // Perimeter Rivets on Gauge Bezel
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const rivet = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 6),
      copperMat
    );
    rivet.position.set(Math.cos(ang) * 0.64, Math.sin(ang) * 0.64, 0.18);
    gaugeGroup.add(rivet);
  }

  // Textured Dial Face
  const dialFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.58, 20),
    new THREE.MeshBasicMaterial({ map: createGaugeDialTexture() })
  );
  dialFace.position.z = 0.145;
  gaugeGroup.add(dialFace);

  // 3D Physical Needle Group
  const needlePivot = new THREE.Group();
  needlePivot.position.z = 0.175;
  gaugeGroup.add(needlePivot);

  const needleBlade = new THREE.Mesh(
    new THREE.ConeGeometry(0.048, 0.48, 4),
    needleMat
  );
  needleBlade.position.y = 0.18;
  needlePivot.add(needleBlade);

  const needleTail = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.14, 0.03),
    brassMat
  );
  needleTail.position.y = -0.07;
  needlePivot.add(needleTail);

  const needleCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.05, 8),
    brassMat
  );
  needleCap.rotation.x = Math.PI / 2;
  needlePivot.add(needleCap);

  // Convex Glass Dome over Gauge
  const gaugeGlass = new THREE.Mesh(
    new THREE.SphereGeometry(0.59, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.28),
    glassCoverMat
  );
  gaugeGlass.rotation.x = Math.PI / 2;
  gaugeGlass.position.z = 0.04;
  gaugeGroup.add(gaugeGlass);

  // Top Overpressure Warning Beacon Lamp
  const beaconBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.13, 0.1, 8),
    brassMat
  );
  beaconBase.position.set(0, 0.74, 0.05);
  gaugeGroup.add(beaconBase);

  const beaconBulb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.095, 0),
    beaconMat
  );
  beaconBulb.position.set(0, 0.85, 0.05);
  gaugeGroup.add(beaconBulb);

  // -------------------------------------------------------------------------
  // C. 3D Interactive Steam Valve Handwheel (Right side: x = +0.78)
  // -------------------------------------------------------------------------
  const valveMountGroup = new THREE.Group();
  valveMountGroup.position.set(0.78, 0.02, 0.06);
  valveMountGroup.rotation.y = 0;
  group.add(valveMountGroup);

  // Valve Bonnet & Threaded Brass Stem
  const valveBonnet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.34, 8),
    brassMat
  );
  valveBonnet.rotation.x = Math.PI / 2;
  valveBonnet.position.z = -0.08;
  valveMountGroup.add(valveBonnet);

  const valveStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.38, 8),
    copperMat
  );
  valveStem.rotation.x = Math.PI / 2;
  valveStem.position.z = 0.12;
  valveMountGroup.add(valveStem);

  // Rotating 3D Handwheel Group
  const valveWheelGroup = new THREE.Group();
  valveWheelGroup.position.z = 0.26;
  valveMountGroup.add(valveWheelGroup);

  // Torus Outer Wheel Rim
  const wheelRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.095, 8, 14),
    valveRedMat
  );
  valveWheelGroup.add(wheelRim);

  // 5 Brass Spokes
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    const spoke = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.052, 0.54, 6),
      brassMat
    );
    spoke.position.set(Math.cos(ang) * 0.27, Math.sin(ang) * 0.27, 0);
    spoke.rotation.z = ang - Math.PI / 2;
    valveWheelGroup.add(spoke);
  }

  // 8 Knurled Grip Knobs around the Outer Rim
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const gripKnob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.22, 6),
      brassMat
    );
    gripKnob.rotation.x = Math.PI / 2;
    gripKnob.position.set(Math.cos(ang) * 0.59, Math.sin(ang) * 0.59, 0);
    valveWheelGroup.add(gripKnob);
  }

  // Central Hexagonal Brass Locknut
  const centerNut = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.14, 6),
    brassMat
  );
  centerNut.rotation.x = Math.PI / 2;
  valveWheelGroup.add(centerNut);

  // Dedicated PointLight illuminating the 3D Gauge & Valve
  const instrumentLight = new THREE.PointLight(0xffb74d, 3.4, 5.0, 1.4);
  instrumentLight.position.set(0, 0.4, 1.1);
  group.add(instrumentLight);

  // Internal physics state
  let pressure = 18;
  let isHolding = false;
  let holdBoostTimer = 0;
  let wheelAngle = 0;

  const spawnSteamPuffs = () => {
    steamPuffs.forEach((p, idx) => {
      p.age = idx * 0.08;
      p.mesh.visible = true;
      p.mesh.position.set(0, 0.24, -0.1);
      p.mesh.scale.setScalar(0.2);
    });
  };

  return {
    group,
    valveWheelGroup,
    setHolding: (holding: boolean) => {
      if (holding && !isHolding) {
        pressure = Math.min(100, pressure + 28);
        wheelAngle += 1.4;
        spawnSteamPuffs();
        onBoostTrigger?.();
      }
      isHolding = holding;
    },
    triggerBurst: () => {
      pressure = Math.min(100, Math.max(pressure + 34, 74));
      wheelAngle += 1.65;
      spawnSteamPuffs();
    },
    getPressure: () => pressure,
    update: (elapsed, delta) => {
      if (isHolding) {
        pressure = Math.min(100, pressure + delta * 92);
        wheelAngle += delta * 5.2;
        holdBoostTimer += delta;
        if (holdBoostTimer > 0.2) {
          holdBoostTimer = 0;
          spawnSteamPuffs();
          onBoostTrigger?.();
        }
      } else {
        pressure = 18 + (pressure - 18) * Math.exp(-delta * 1.45);
      }

      // Smoothly interpolate wheel rotation + screw depth along stem
      valveWheelGroup.rotation.z = THREE.MathUtils.lerp(
        valveWheelGroup.rotation.z,
        -wheelAngle,
        delta * 10
      );
      valveWheelGroup.position.z =
        0.26 + Math.sin(valveWheelGroup.rotation.z * 0.5) * 0.03;

      // High-pressure mechanical needle vibration
      const jitter =
        pressure > 65 ? Math.sin(elapsed * 42) * ((pressure - 60) / 16) : 0;
      const clampedPressure = Math.max(0, Math.min(100, pressure + jitter));

      // Map 0..100 PSI to needle angle (+125 deg down to -125 deg in Three.js Z rotation)
      const deg = 125 - (clampedPressure / 100) * 250;
      needlePivot.rotation.z = THREE.MathUtils.degToRad(deg);

      // Overpressure beacon lamp glow
      const isOver = clampedPressure > 75;
      beaconMat.emissiveIntensity = isOver
        ? 2.2 + Math.sin(elapsed * 18) * 1.1
        : 0.25;
      instrumentLight.color.setHex(isOver ? 0xff7043 : 0xffb74d);

      // Animate 3D relief steam puffs
      steamPuffs.forEach((p) => {
        if (p.age < 1.0) {
          p.age += delta * 1.5;
          p.mesh.position.y = 0.24 + p.age * p.speedY;
          p.mesh.position.x =
            p.driftX * p.age + Math.sin(elapsed * 6 + p.age * 4) * 0.05;
          const scale = Math.sin(Math.min(1, p.age) * Math.PI) * 1.25;
          p.mesh.scale.setScalar(Math.max(0.01, scale));
          p.mesh.rotation.y += delta * 3;
          p.mesh.rotation.z += delta * 2;
        } else {
          p.mesh.visible = false;
        }
      });
    },
  };
}

