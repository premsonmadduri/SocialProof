const LEGACY_DEVICE_ID_KEY = 'social_proof_device_id_v1';
const FINGERPRINT_ID_KEY = 'social_proof_fp_id_v2';
const JOINED_FLAG_KEY = 'social_proof_joined_v2';
const IDB_NAME = 'social_proof_identity_db';
const IDB_STORE = 'identity';
const IDB_VERSION = 1;
const COOKIE_MAX_AGE_SECONDS = 34560000; // 400 days (browser-compliant max)
const DEVICE_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;

export interface DeviceIdentity {
  primaryId: string;
  legacyId: string | null;
  cachedJoined: boolean;
}

function isValidStoredId(value: string | null | undefined): value is string {
  return typeof value === 'string' && DEVICE_ID_REGEX.test(value);
}

function readLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors in restricted WebViews / Private mode
  }
}

function removeLocalStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

function readCookie(key: string): string | null {
  try {
    const match = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${key}=`));
    if (!match) return null;
    return decodeURIComponent(match.slice(key.length + 1));
  } catch {
    return null;
  }
}

function writeCookie(key: string, value: string): void {
  try {
    const secureAttr =
      typeof window !== 'undefined' && window.location.protocol === 'https:'
        ? '; Secure'
        : '';
    document.cookie = `${key}=${encodeURIComponent(
      value
    )}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secureAttr}`;
  } catch {
    // Ignore cookie errors in restricted contexts
  }
}

function clearCookie(key: string): void {
  try {
    document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    // Ignore cookie errors
  }
}

function openIdentityDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (db: IDBDatabase | null) => {
      if (!settled) {
        settled = true;
        resolve(db);
      }
    };

    const timer = window.setTimeout(() => finish(null), 800);

    try {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };

      request.onsuccess = () => {
        window.clearTimeout(timer);
        finish(request.result);
      };

      request.onerror = () => {
        window.clearTimeout(timer);
        finish(null);
      };

      request.onblocked = () => {
        window.clearTimeout(timer);
        finish(null);
      };
    } catch {
      window.clearTimeout(timer);
      finish(null);
    }
  });
}

async function readIdbValue(key: string): Promise<string | null> {
  const db = await openIdentityDb();
  if (!db) return null;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (val: string | null) => {
      if (!settled) {
        settled = true;
        try {
          db.close();
        } catch {
          // ignore
        }
        resolve(val);
      }
    };

    const timer = window.setTimeout(() => finish(null), 800);

    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => {
        window.clearTimeout(timer);
        finish(typeof req.result === 'string' ? req.result : null);
      };
      req.onerror = () => {
        window.clearTimeout(timer);
        finish(null);
      };
    } catch {
      window.clearTimeout(timer);
      finish(null);
    }
  });
}

async function writeIdbEntries(entries: Record<string, string | null>): Promise<void> {
  const db = await openIdentityDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        try {
          db.close();
        } catch {
          // ignore
        }
        resolve();
      }
    };

    const timer = window.setTimeout(finish, 800);

    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      for (const [key, value] of Object.entries(entries)) {
        if (value === null) {
          store.delete(key);
        } else {
          store.put(value, key);
        }
      }
      tx.oncomplete = () => {
        window.clearTimeout(timer);
        finish();
      };
      tx.onerror = () => {
        window.clearTimeout(timer);
        finish();
      };
      tx.onabort = () => {
        window.clearTimeout(timer);
        finish();
      };
    } catch {
      window.clearTimeout(timer);
      finish();
    }
  });
}

function getWebGLSignature(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return 'no-webgl';

    let vendor = '';
    let renderer = '';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      vendor = String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '');
      renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
    } else {
      vendor = String(gl.getParameter(gl.VENDOR) || '');
      renderer = String(gl.getParameter(gl.RENDERER) || '');
    }

    const maxTexture = String(gl.getParameter(gl.MAX_TEXTURE_SIZE) || '');
    const maxViewport = String(gl.getParameter(gl.MAX_VIEWPORT_DIMS) || '');

    const loseExt = gl.getExtension('WEBGL_lose_context');
    loseExt?.loseContext();

    return `${vendor}|${renderer}|${maxTexture}|${maxViewport}`;
  } catch {
    return 'webgl-err';
  }
}

function getCanvas2DSignature(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 260;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-2d';

    ctx.textBaseline = 'top';
    const gradient = ctx.createLinearGradient(0, 0, 260, 60);
    gradient.addColorStop(0, '#0071E3');
    gradient.addColorStop(0.5, '#5856D6');
    gradient.addColorStop(1, '#10B981');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 260, 60);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.arc(36, 30, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1D1D1F';
    ctx.font = '600 15px sans-serif';
    ctx.fillText('SocialProof 2026', 64, 10);
    ctx.font = '500 14px serif';
    ctx.fillText('దాసం బేబీ వెంకటేష్', 64, 32);

    return canvas.toDataURL('image/png').slice(-180);
  } catch {
    return '2d-err';
  }
}

function fallbackDeterministicHex(input: string): string {
  // Deterministic 128-bit (32-hex) multi-lane FNV-1a fallback when crypto.subtle is unavailable
  const seeds = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b];
  const lanes = seeds.map((seed, laneIdx) => {
    let h = seed >>> 0;
    for (let i = 0; i < input.length; i++) {
      h ^= (input.charCodeAt(i) + laneIdx * 31) & 0xff;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35) >>> 0;
    h ^= h >>> 16;
    return (h >>> 0).toString(16).padStart(8, '0');
  });
  return lanes.join('');
}

async function sha256Hex(input: string): Promise<string> {
  try {
    if (
      typeof crypto !== 'undefined' &&
      crypto.subtle &&
      typeof TextEncoder !== 'undefined'
    ) {
      const encoded = new TextEncoder().encode(input);
      const buffer = await crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fall through to deterministic JS hash
  }
  return fallbackDeterministicHex(input);
}

/**
 * Generates a privacy-safe, deterministic SHA-256 device signature (`fp_<32-hex>`)
 * using stable hardware & rendering signals that stay consistent across
 * normal browsers and in-app WebViews (e.g., WhatsApp) on the same phone.
 */
export async function computeDeviceFingerprintId(): Promise<string> {
  const screenW = typeof window !== 'undefined' ? window.screen?.width || 0 : 0;
  const screenH = typeof window !== 'undefined' ? window.screen?.height || 0 : 0;
  const minDim = Math.min(screenW, screenH);
  const maxDim = Math.max(screenW, screenH);
  const dpr =
    typeof window !== 'undefined'
      ? Math.round((window.devicePixelRatio || 1) * 100)
      : 100;
  const colorDepth =
    typeof window !== 'undefined' ? window.screen?.colorDepth || 0 : 0;

  const nav =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator & { deviceMemory?: number })
      : null;

  const cores = nav?.hardwareConcurrency || 0;
  const memory = nav?.deviceMemory || 0;
  const touchPoints = nav?.maxTouchPoints || 0;
  const platform = (nav?.platform || '').trim().toLowerCase();
  const language = (nav?.language || '').trim().toLowerCase();

  let timezone = '';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    timezone = String(new Date().getTimezoneOffset());
  }

  const webgl = getWebGLSignature();
  const canvas2d = getCanvas2DSignature();

  const payload = [
    'sp-v2',
    `${minDim}x${maxDim}`,
    `dpr:${dpr}`,
    `cd:${colorDepth}`,
    `cpu:${cores}`,
    `mem:${memory}`,
    `tp:${touchPoints}`,
    `plat:${platform}`,
    `lang:${language}`,
    `tz:${timezone}`,
    `gl:${webgl}`,
    `c2d:${canvas2d}`,
  ].join('||');

  const digest = await sha256Hex(payload);
  return `fp_${digest.slice(0, 32)}`;
}

/**
 * Fast synchronous check used during initial render so returning joined users
 * immediately see "You joined" without flashing "Join Community".
 */
export function readCachedJoinedSync(): boolean {
  return (
    readLocalStorage(JOINED_FLAG_KEY) === '1' ||
    readCookie(JOINED_FLAG_KEY) === '1'
  );
}

/**
 * Resolves the device's deterministic fingerprint ID, any legacy pre-upgrade
 * device ID (from localStorage, cookies, or IndexedDB), and cached joined status.
 */
export async function resolveDeviceIdentity(): Promise<DeviceIdentity> {
  const [fingerprintId, idbLegacyId, idbFpId, idbJoined] = await Promise.all([
    computeDeviceFingerprintId(),
    readIdbValue(LEGACY_DEVICE_ID_KEY),
    readIdbValue(FINGERPRINT_ID_KEY),
    readIdbValue(JOINED_FLAG_KEY),
  ]);

  const localLegacy = readLocalStorage(LEGACY_DEVICE_ID_KEY);
  const cookieLegacy = readCookie(LEGACY_DEVICE_ID_KEY);

  const rawLegacy = [localLegacy, cookieLegacy, idbLegacyId].find((candidate) =>
    isValidStoredId(candidate)
  );
  const legacyId =
    rawLegacy && rawLegacy !== fingerprintId ? rawLegacy : null;

  const primaryId = isValidStoredId(fingerprintId)
    ? fingerprintId
    : isValidStoredId(idbFpId)
      ? idbFpId
      : legacyId || `fp_${fallbackDeterministicHex(String(Date.now()))}`;

  const cachedJoined =
    readCachedJoinedSync() || idbJoined === '1';

  // Mirror IDs across all 3 stores so future reloads stay resilient
  writeLocalStorage(FINGERPRINT_ID_KEY, primaryId);
  writeCookie(FINGERPRINT_ID_KEY, primaryId);
  if (legacyId) {
    writeLocalStorage(LEGACY_DEVICE_ID_KEY, legacyId);
    writeCookie(LEGACY_DEVICE_ID_KEY, legacyId);
  }
  if (cachedJoined) {
    writeLocalStorage(JOINED_FLAG_KEY, '1');
    writeCookie(JOINED_FLAG_KEY, '1');
  }

  void writeIdbEntries({
    [FINGERPRINT_ID_KEY]: primaryId,
    ...(legacyId ? { [LEGACY_DEVICE_ID_KEY]: legacyId } : {}),
    ...(cachedJoined ? { [JOINED_FLAG_KEY]: '1' } : {}),
  });

  return {
    primaryId,
    legacyId,
    cachedJoined,
  };
}

/**
 * Persists joined state and device ID simultaneously across localStorage,
 * cookies, and IndexedDB for instant repeat-visit recognition.
 */
export async function persistJoinedLocally(primaryId: string): Promise<void> {
  writeLocalStorage(FINGERPRINT_ID_KEY, primaryId);
  writeLocalStorage(JOINED_FLAG_KEY, '1');
  writeCookie(FINGERPRINT_ID_KEY, primaryId);
  writeCookie(JOINED_FLAG_KEY, '1');
  await writeIdbEntries({
    [FINGERPRINT_ID_KEY]: primaryId,
    [JOINED_FLAG_KEY]: '1',
  });
}

/**
 * Clears local joined cache if Firestore authoritatively reports not joined.
 */
export async function clearJoinedLocally(): Promise<void> {
  removeLocalStorage(JOINED_FLAG_KEY);
  clearCookie(JOINED_FLAG_KEY);
  await writeIdbEntries({ [JOINED_FLAG_KEY]: null });
}
