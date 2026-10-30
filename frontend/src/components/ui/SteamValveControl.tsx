import { useEffect, useRef, useState } from 'react';

interface SteamValveControlProps {
  steamBurst: number;
  onTriggerBoost: () => void;
}

export function SteamValveControl({
  steamBurst,
  onTriggerBoost,
}: SteamValveControlProps) {
  const [wheelAngle, setWheelAngle] = useState(0);
  const [pressure, setPressure] = useState(18); // 0..100
  const [isHolding, setIsHolding] = useState(false);
  const [steamPuffKey, setSteamPuffKey] = useState(0);

  const pressureRef = useRef(18);
  const isHoldingRef = useRef(false);

  // Sync external bursts (e.g. login/register/navigation) with gauge needle
  useEffect(() => {
    if (steamBurst > 0) {
      pressureRef.current = Math.min(100, Math.max(pressureRef.current + 38, 72));
    }
  }, [steamBurst]);

  // Smooth physics loop for analog needle & hold-to-pressurize
  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();
    let holdBoostTimer = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isHoldingRef.current) {
        pressureRef.current = Math.min(100, pressureRef.current + dt * 95);
        setWheelAngle((prev) => prev + dt * 260);
        holdBoostTimer += dt;
        if (holdBoostTimer > 0.18) {
          holdBoostTimer = 0;
          onTriggerBoost();
        }
      } else {
        // Natural decay toward baseline idle pressure (18%)
        pressureRef.current =
          18 + (pressureRef.current - 18) * Math.exp(-dt * 1.45);
      }

      // Add subtle mechanical needle vibration at high pressure
      const jitter =
        pressureRef.current > 65
          ? (Math.sin(now * 0.045) * (pressureRef.current - 60)) / 18
          : 0;

      setPressure(Math.max(0, Math.min(100, pressureRef.current + jitter)));
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onTriggerBoost]);

  const handlePointerDown = () => {
    isHoldingRef.current = true;
    setIsHolding(true);
    pressureRef.current = Math.min(100, pressureRef.current + 32);
    setWheelAngle((prev) => prev + 95);
    setSteamPuffKey((prev) => prev + 1);
    onTriggerBoost();
  };

  const handlePointerUp = () => {
    isHoldingRef.current = false;
    setIsHolding(false);
  };

  // Needle angle from -125 deg (min) to +125 deg (max)
  const needleRotation = -125 + (pressure / 100) * 250;
  const isOverpressure = pressure > 75;
  const displayWheelAngle = wheelAngle + steamBurst * 95;
  const displayPuffKey = steamPuffKey + steamBurst;

  return (
    <div className="valve-gauge-assembly" title="Mantener o girar válvula para acelerar maquinaria">
      {/* Mini Manómetro Analógico de Latón */}
      <div className={`mini-pressure-gauge ${isOverpressure ? 'overpressure' : ''}`}>
        <svg viewBox="0 0 44 44" className="mini-gauge-svg" aria-hidden="true">
          <defs>
            <radialGradient id="gaugeFaceGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#261d15" />
              <stop offset="78%" stopColor="#140f0a" />
              <stop offset="100%" stopColor="#090604" />
            </radialGradient>
            <linearGradient id="brassRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0c882" />
              <stop offset="50%" stopColor="#b88342" />
              <stop offset="100%" stopColor="#5e3e19" />
            </linearGradient>
          </defs>

          {/* Bisel exterior de bronce */}
          <circle
            cx="22"
            cy="22"
            r="20"
            fill="url(#gaugeFaceGrad)"
            stroke="url(#brassRimGrad)"
            strokeWidth="2.4"
          />

          {/* Arco de escala normal */}
          <path
            d="M 9.5 31 A 15 15 0 1 1 34.5 31"
            fill="none"
            stroke="rgba(214, 175, 118, 0.3)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Zona roja de alta presión (derecha) */}
          <path
            d="M 31.5 11.5 A 15 15 0 0 1 34.5 31"
            fill="none"
            stroke="#e56b55"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Marcas de graduación */}
          {[-125, -75, -25, 25, 75, 125].map((deg) => (
            <g key={deg} transform={`translate(22, 22) rotate(${deg})`}>
              <line
                x1="0"
                y1="-16.2"
                x2="0"
                y2="-13.2"
                stroke="#d6af76"
                strokeWidth="1.1"
              />
            </g>
          ))}

          {/* Aguja física */}
          <g transform={`translate(22, 22) rotate(${needleRotation})`}>
            <polygon
              points="-1.4,3.5 0,-15.2 1.4,3.5"
              fill={isOverpressure ? '#ff7a59' : '#f3d088'}
            />
            <circle cx="0" cy="0" r="2.8" fill="#c8985e" stroke="#120c07" strokeWidth="1" />
          </g>

          {/* Reflejo de cristal abombado */}
          <path
            d="M 10 15 A 14 14 0 0 1 32 12"
            fill="none"
            stroke="rgba(255, 245, 230, 0.14)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Tubería de unión de cobre */}
      <div className="valve-pipe-bridge" aria-hidden="true" />

      {/* Volante Físico de Válvula (Botón interactivo sin texto) */}
      <button
        type="button"
        className={`physical-valve-wheel ${isHolding ? 'is-pressed' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        aria-label="Girar válvula de presión para acelerar engranajes"
      >
        {/* Puffs de vapor al accionar la válvula */}
        <span key={displayPuffKey} className="valve-steam-puff" aria-hidden="true" />

        <svg
          viewBox="0 0 48 48"
          className="valve-wheel-svg"
          style={{ transform: `rotate(${displayWheelAngle}deg)` }}
        >
          <defs>
            <radialGradient id="valveMetal" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#e58c56" />
              <stop offset="55%" stopColor="#a84420" />
              <stop offset="100%" stopColor="#4f1c0b" />
            </radialGradient>
            <radialGradient id="brassNut" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fae09e" />
              <stop offset="65%" stopColor="#b88339" />
              <stop offset="100%" stopColor="#5e3d12" />
            </radialGradient>
          </defs>

          {/* Rayos internos del volante (5 brazos) */}
          {[0, 72, 144, 216, 288].map((ang) => (
            <g key={ang} transform={`translate(24, 24) rotate(${ang})`}>
              <rect
                x="-2.1"
                y="-19"
                width="4.2"
                height="19"
                rx="1.5"
                fill="url(#brassNut)"
                stroke="#241207"
                strokeWidth="0.8"
              />
            </g>
          ))}

          {/* Aro toroidal exterior de la válvula */}
          <circle
            cx="24"
            cy="24"
            r="18.5"
            fill="none"
            stroke="url(#valveMetal)"
            strokeWidth="5.2"
          />
          <circle
            cx="24"
            cy="24"
            r="18.5"
            fill="none"
            stroke="rgba(255, 220, 185, 0.25)"
            strokeWidth="1"
          />

          {/* Muescas de agarre (knurling) alrededor del volante */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
            <g key={ang} transform={`translate(24, 24) rotate(${ang})`}>
              <circle
                cx="0"
                cy="-20.2"
                r="2.4"
                fill="url(#valveMetal)"
                stroke="#2b1006"
                strokeWidth="0.8"
              />
            </g>
          ))}

          {/* Tuerca central hexagonal/circular de latón */}
          <circle
            cx="24"
            cy="24"
            r="6.2"
            fill="url(#brassNut)"
            stroke="#241306"
            strokeWidth="1.2"
          />
          <circle cx="24" cy="24" r="2.3" fill="#2b180a" />
        </svg>
      </button>
    </div>
  );
}
