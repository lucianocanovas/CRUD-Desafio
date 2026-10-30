import type { OAuthLoginRequest } from '../models/user.model';

export const AUTH0_DOMAIN =
  import.meta.env.VITE_AUTH0_DOMAIN || 'dev-1x6qm5adx348o8vd.us.auth0.com';
export const AUTH0_CLIENT_ID =
  import.meta.env.VITE_AUTH0_CLIENT_ID || '7oT83TwUIejo9yjQtEoRjhYUhni4VhXq';

const PKCE_VERIFIER_KEY = 'oauth_pkce_code_verifier';
const PKCE_STATE_KEY = 'oauth_pkce_state';
const OAUTH_POPUP_RESULT_KEY = 'oauth_popup_result_v1';

/**
 * Implementación síncrona de SHA-256 (FIPS 180-4) para generar el `code_challenge` PKCE (S256)
 * de forma instantánea dentro del evento `onClick` sin depender de `async/await` ni `crypto.subtle`.
 */
function sha256Bytes(ascii: string): Uint8Array {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const bytes: number[] = [];
  for (let i = 0; i < ascii.length; i++) {
    bytes.push(ascii.charCodeAt(i) & 0xff);
  }

  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) {
    bytes.push(0);
  }

  // Longitud en bits (big-endian 64-bit)
  bytes.push(0, 0, 0, 0);
  bytes.push(
    (bitLength >>> 24) & 0xff,
    (bitLength >>> 16) & 0xff,
    (bitLength >>> 8) & 0xff,
    bitLength & 0xff
  );

  const w = new Array<number>(64).fill(0);

  for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += 64) {
    for (let i = 0; i < 16; i++) {
      const j = chunkStart + i * 4;
      w[i] =
        ((bytes[j] << 24) |
          (bytes[j + 1] << 16) |
          (bytes[j + 2] << 8) |
          bytes[j + 3]) >>>
        0;
    }

    for (let i = 16; i < 64; i++) {
      const s0 =
        rightRotate(w[i - 15], 7) ^
        rightRotate(w[i - 15], 18) ^
        (w[i - 15] >>> 3);
      const s1 =
        rightRotate(w[i - 2], 17) ^
        rightRotate(w[i - 2], 19) ^
        (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h0] = h;

    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h0 + S1 + ch + k[i] + w[i]) >>> 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h0 = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + h0) >>> 0;
  }

  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    out[i * 4] = (h[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (h[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (h[i] >>> 8) & 0xff;
    out[i * 4 + 3] = h[i] & 0xff;
  }
  return out;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateRandomString(byteLength = 32): string {
  const array = new Uint8Array(byteLength);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < byteLength; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return base64UrlEncode(array);
}

function generateCodeChallengeSync(verifier: string): string {
  return base64UrlEncode(sha256Bytes(verifier));
}

function getRedirectUri(): string {
  const { protocol, hostname, port } = window.location;
  // Normalizar 127.0.0.1 a localhost para coincidir con el Allowed Callback URL en Auth0
  const normalizedHost = hostname === '127.0.0.1' ? 'localhost' : hostname;
  return `${protocol}//${normalizedHost}${port ? `:${port}` : ''}`;
}

interface IdTokenPayload {
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  nickname?: string;
  sub?: string;
}

function decodeJwtPayload(token: string): IdTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    );
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as IdTokenPayload;
  } catch {
    return null;
  }
}

function buildOAuthLoginPayload(profile: IdTokenPayload): OAuthLoginRequest {
  const email = (profile.email || '').trim().toLowerCase();
  let nombre = profile.given_name?.trim() || '';
  let apellido = profile.family_name?.trim() || '';

  if ((!nombre || !apellido) && profile.name) {
    const parts = profile.name.trim().split(/\s+/);
    if (!nombre) nombre = parts[0] || 'Usuario';
    if (!apellido) apellido = parts.slice(1).join(' ') || 'Google';
  }

  return {
    email,
    nombre: nombre || profile.nickname || 'Usuario',
    apellido: apellido || 'Google',
    provider: 'GOOGLE',
    providerId: profile.sub || `google-${email}`,
  };
}

export function buildAuthorizeUrl(): string {
  const verifier = generateRandomString(32);
  const state = generateRandomString(16);
  const challenge = generateCodeChallengeSync(verifier);

  localStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  localStorage.setItem(PKCE_STATE_KEY, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH0_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    scope: 'openid profile email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });

  return `https://${AUTH0_DOMAIN}/authorize?${params.toString()}`;
}

/**
 * Inicia el flujo real OAuth 2.0 Authorization Code con PKCE hacia Auth0 / Google.
 * - Si se ejecuta en una pestaña normal, redirige de forma síncrona.
 * - Si se ejecuta dentro de un iframe (ej. previsualizador integrado del IDE), abre una
 *   ventana emergente para evitar el bloqueo `X-Frame-Options: DENY` de Google/Auth0
 *   y devuelve el usuario autenticado por `localStorage` / `window.opener`.
 */
export function startGoogleOAuthRedirect(
  onPopupSuccess?: (payload: OAuthLoginRequest) => void,
  onPopupError?: (message: string) => void
): void {
  const authorizeUrl = buildAuthorizeUrl();

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  if (isInIframe) {
    localStorage.removeItem(OAUTH_POPUP_RESULT_KEY);
    const popup = window.open(
      authorizeUrl,
      'auth0_google_oauth_popup',
      'width=520,height=660,menubar=no,toolbar=no,location=yes,status=no'
    );

    if (!popup) {
      onPopupError?.(
        'El navegador bloqueó la ventana emergente de Google OAuth. Abrí http://localhost:5173 en una pestaña del navegador.'
      );
      return;
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== OAUTH_POPUP_RESULT_KEY || !e.newValue) return;
      window.removeEventListener('storage', handleStorage);
      try {
        const parsed = JSON.parse(e.newValue) as {
          ok: boolean;
          payload?: OAuthLoginRequest;
          error?: string;
        };
        localStorage.removeItem(OAUTH_POPUP_RESULT_KEY);
        if (parsed.ok && parsed.payload) {
          onPopupSuccess?.(parsed.payload);
        } else if (parsed.error) {
          onPopupError?.(parsed.error);
        }
      } catch {
        // Ignorar errores de parseo
      }
    };

    window.addEventListener('storage', handleStorage);
    return;
  }

  window.location.href = authorizeUrl;
}

// Promesa singleton a nivel de módulo para evitar que el doble montaje de React <StrictMode>
// consuma o descarte el código `?code=...` o el mensaje `?error=...` de la URL.
let activeCallbackPromise: Promise<OAuthLoginRequest | null> | null = null;

async function processOAuthCallbackInternal(): Promise<OAuthLoginRequest | null> {
  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    window.history.replaceState({}, document.title, window.location.pathname);
    const message =
      errorDescription || `Error de autenticación OAuth: ${error}`;
    if (window.opener && window.opener !== window) {
      localStorage.setItem(
        OAUTH_POPUP_RESULT_KEY,
        JSON.stringify({ ok: false, error: message })
      );
      window.close();
    }
    throw new Error(message);
  }

  const code = searchParams.get('code');
  if (code) {
    const verifier = localStorage.getItem(PKCE_VERIFIER_KEY);
    localStorage.removeItem(PKCE_VERIFIER_KEY);
    localStorage.removeItem(PKCE_STATE_KEY);
    window.history.replaceState({}, document.title, window.location.pathname);

    if (!verifier) {
      throw new Error(
        'No se encontró el verificador PKCE de la sesión. Intentá iniciar sesión con Google nuevamente.'
      );
    }

    const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: AUTH0_CLIENT_ID,
        code_verifier: verifier,
        code,
        redirect_uri: getRedirectUri(),
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.json().catch(() => ({}));
      const msg =
        errBody.error_description ||
        errBody.message ||
        'No se pudo validar el código de autorización con Google / Auth0.';
      if (window.opener && window.opener !== window) {
        localStorage.setItem(
          OAUTH_POPUP_RESULT_KEY,
          JSON.stringify({ ok: false, error: msg })
        );
        window.close();
      }
      throw new Error(msg);
    }

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      id_token?: string;
    };

    let resolvedPayload: OAuthLoginRequest | null = null;

    // 1. Extraer datos verificados desde id_token
    if (tokenData.id_token) {
      const decoded = decodeJwtPayload(tokenData.id_token);
      if (decoded?.email) {
        resolvedPayload = buildOAuthLoginPayload(decoded);
      }
    }

    // 2. Respaldo consultando /userinfo con el access_token
    if (!resolvedPayload && tokenData.access_token) {
      const userInfoRes = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (userInfoRes.ok) {
        const profile = (await userInfoRes.json()) as IdTokenPayload;
        if (profile.email) {
          resolvedPayload = buildOAuthLoginPayload(profile);
        }
      }
    }

    if (!resolvedPayload) {
      throw new Error(
        'La cuenta de Google no devolvió un correo electrónico válido.'
      );
    }

    if (window.opener && window.opener !== window) {
      localStorage.setItem(
        OAUTH_POPUP_RESULT_KEY,
        JSON.stringify({ ok: true, payload: resolvedPayload })
      );
      window.close();
    }

    return resolvedPayload;
  }

  // Soporte adicional por si el proveedor retorna id_token o access_token en el hash
  if (
    window.location.hash.includes('access_token=') ||
    window.location.hash.includes('id_token=')
  ) {
    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, '')
    );
    const idToken = hashParams.get('id_token');
    const accessToken = hashParams.get('access_token');
    window.history.replaceState({}, document.title, window.location.pathname);

    if (idToken) {
      const decoded = decodeJwtPayload(idToken);
      if (decoded?.email) {
        return buildOAuthLoginPayload(decoded);
      }
    }

    if (accessToken) {
      const response = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const profile = (await response.json()) as IdTokenPayload;
        if (profile.email) {
          return buildOAuthLoginPayload(profile);
        }
      }
    }
  }

  return null;
}

export function consumeOAuthCallbackIfPresent(): Promise<OAuthLoginRequest | null> {
  if (!activeCallbackPromise) {
    activeCallbackPromise = processOAuthCallbackInternal().finally(() => {
      setTimeout(() => {
        activeCallbackPromise = null;
      }, 500);
    });
  }
  return activeCallbackPromise;
}
