// getGeolocationPosition.ts

type AnyErr = GeolocationPositionError & { message?: string };

const MAX_CACHE_AGE_MS = 30_000;
const COARSE_DP = 3;

type Cached = { timestamp: number; position: GeolocationPosition };
let memCache: Cached | null = null;

try {
	sessionStorage.removeItem('lastGeoPosition');
} catch {
	// ignore sessionStorage unavailability (SSR, privacy mode, etc.)
	void 0;
}
const quantize = (v: number, dp: number) => {
	const f = 10 ** dp;
	return Math.round(v * f) / f;
};

function toCoarsePosition(src: GeolocationPosition, dp = COARSE_DP): GeolocationPosition {
	const c = src.coords;
	const coarse: GeolocationPosition = {
		coords: {
			latitude: quantize(c.latitude, dp),
			longitude: quantize(c.longitude, dp),
			accuracy: c.accuracy,
			altitude: c.altitude ?? null,
			altitudeAccuracy: c.altitudeAccuracy ?? null,
			heading: c.heading ?? null,
			speed: c.speed ?? null,
		} as GeolocationCoordinates,
		timestamp: src.timestamp,
		toJSON() {
			return {
				coords: this.coords,
				timestamp: this.timestamp,
			};
		},
	};
	return coarse;
}

export async function getGeolocationPosition(opts?: PositionOptions): Promise<GeolocationPosition> {
	if (typeof window === 'undefined' || !('geolocation' in navigator)) {
		throw new Error('Geolocation API not available');
	}

	// 0) Serve a fresh cached fix immediately if available (in-memory only)
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
		const coarse = toCoarsePosition(pos);
		cache(coarse);
		return coarse;
	} catch (e) {
		const err = e as AnyErr;
		// If the user denied, bail immediately
		if (err.code === err.PERMISSION_DENIED) throw err;
	}

	// 2) Transient fallback: wait for the first fix via watchPosition (up to 20s)
	try {
		const pos = await watchOnce({
			enableHighAccuracy: false,
			timeout: 20_000,
			maximumAge: 0,
			...opts,
		});
		const coarse = toCoarsePosition(pos);
		cache(coarse);
		return coarse;
	} catch (e) {
		const err = e as AnyErr;
		if (isTransient(err)) {
			try {
				const pos = await getOnce({
					enableHighAccuracy: false,
					timeout: 12_000,
					maximumAge: 2 * 60_000,
					...opts,
				});
				const coarse = toCoarsePosition(pos);
				cache(coarse);
				return coarse;
			} catch (e) {
				// ignore transient failure; a final high-accuracy attempt will follow
				void e;
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
	const coarse = toCoarsePosition(pos);
	cache(coarse);
	return coarse;
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
	if (err.code === err.POSITION_UNAVAILABLE) return true;
	const m = String(err.message || '').toLowerCase();
	if (m.includes('kclerrorlocationunknown')) return true;
	if (m.includes('location unknown')) return true;
	return false;
}

function cache(position: GeolocationPosition) {
	memCache = { timestamp: Date.now(), position };
}

function readCached(): Cached | null {
	return memCache;
}
