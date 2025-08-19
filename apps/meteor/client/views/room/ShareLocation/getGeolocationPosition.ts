// getGeolocationPosition.ts
type AnyErr = GeolocationPositionError & { message?: string };

const CACHE_KEY = 'lastGeoPosition';
const MAX_CACHE_AGE_MS = 5 * 60 * 1000; // 5 minutes

export async function getGeolocationPosition(opts?: PositionOptions): Promise<GeolocationPosition> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    throw new Error('Geolocation API not available');
  }

  // 0) Serve a fresh cached fix immediately if available
  const cached = readCached();
  if (cached && Date.now() - cached.timestamp < MAX_CACHE_AGE_MS) {
    return cached.position;
  }

  // 1) Quick relaxed single read (lets Apple CoreLocation settle)
  try {
    const pos = await getOnce({
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 60_000,
      ...opts,
    });
    cache(pos);
    return pos;
  } catch (e) {
    const err = e as AnyErr;
    // If the user denied, bail immediately
    if (err.code === err.PERMISSION_DENIED) throw err;
    // Otherwise continue to fallback
  }

  // 2) Transient fallback: wait for the first fix via watchPosition (up to 20s)
  try {
    const pos = await watchOnce({
      enableHighAccuracy: false,
      timeout: 20_000,
      maximumAge: 0,
      ...opts,
    });
    cache(pos);
    return pos;
  } catch (e) {
    const err = e as AnyErr;
    // If it's the well-known transient Apple error, try one more relaxed single read
    if (isTransient(err)) {
      try {
        const pos = await getOnce({
          enableHighAccuracy: false,
          timeout: 12_000,
          maximumAge: 2 * 60_000,
          ...opts,
        });
        cache(pos);
        return pos;
      } catch {
        // fall through to final attempt
      }
    }
  }

  // 3) Final attempt: high-accuracy single read (may take longer indoors)
  const pos = await getOnce({
    enableHighAccuracy: true,
    timeout: 15_000,
    maximumAge: 0,
    ...opts,
  });
  cache(pos);
  return pos;
}

function getOnce(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function watchOnce(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    let watchId: number | null = null;
    const timer = window.setTimeout(() => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      reject(new Error('Timed out waiting for position'));
    }, options.timeout ?? 20000);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        window.clearTimeout(timer);
        resolve(pos);
      },
      (err) => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        window.clearTimeout(timer);
        reject(err);
      },
      options,
    );
  });
}

function isTransient(err: AnyErr): boolean {
  if (!err) return false;
  // POSITION_UNAVAILABLE (2) is commonly transient
  if (err.code === err.POSITION_UNAVAILABLE) return true;
  const m = String(err.message || '').toLowerCase();
  // Apple/macOS transient message
  if (m.includes('kclerrorlocationunknown')) return true;
  if (m.includes('location unknown')) return true;
  return false;
}

function cache(position: GeolocationPosition) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), position }),
    );
  } catch {
    // ignore
  }
}

function readCached():
  | { timestamp: number; position: GeolocationPosition }
  | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
