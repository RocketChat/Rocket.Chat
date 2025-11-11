import { jest } from '@jest/globals';

// Helpers to craft GeolocationPosition
const makePos = (lat: number, lon: number): GeolocationPosition =>
	({
		coords: {
			latitude: lat,
			longitude: lon,
			accuracy: 5,
			altitude: null,
			altitudeAccuracy: null,
			heading: null,
			speed: null,
		} as GeolocationCoordinates,
		timestamp: Date.now(),
		toJSON() {
			return { coords: this.coords, timestamp: this.timestamp };
		},
	}) as any;

// Build a mockable geolocation API
const buildGeo = () => {
	let currentSuccess: PositionCallback | null = null;
	let currentError: PositionErrorCallback | null = null;
	let watchSuccess: PositionCallback | null = null;
	let watchError: PositionErrorCallback | null = null;
	let nextWatchId = 1;

	return {
		getCurrentPosition: jest.fn((success: PositionCallback, error?: PositionErrorCallback) => {
			currentSuccess = success;
			currentError = error || null;
		}),
		watchPosition: jest.fn((success: PositionCallback, error?: PositionErrorCallback) => {
			watchSuccess = success;
			watchError = error || null;
			return nextWatchId++;
		}),
		clearWatch: jest.fn(),
		// helpers
		succeedGetOnce(lat: number, lon: number) {
			currentSuccess && currentSuccess(makePos(lat, lon));
		},
		errorGetOnce(err: any) {
			currentError && currentError(err as GeolocationPositionError);
		},
		succeedWatch(lat: number, lon: number) {
			watchSuccess && watchSuccess(makePos(lat, lon));
		},
		errorWatch(err: any) {
			watchError && watchError(err as GeolocationPositionError);
		},
	};
};

describe('getGeolocationPosition', () => {
	const originalGeo = global.navigator.geolocation;

	beforeEach(() => {
		jest.resetModules();
	});

	afterAll(() => {
		Object.defineProperty(global.navigator, 'geolocation', { value: originalGeo, configurable: true });
	});

	test('throws when Geolocation API is not available', async () => {
		// Remove the property entirely so `('geolocation' in navigator)` becomes false
		delete (global.navigator as any).geolocation;
		const { getGeolocationPosition } = await import('./getGeolocationPosition');
		await expect(getGeolocationPosition()).rejects.toThrow('Geolocation API not available');
	});

	test('resolves via single getOnce and quantizes to 3 dp', async () => {
		const geo = buildGeo();
		Object.defineProperty(global.navigator, 'geolocation', { value: geo, configurable: true });
		const { getGeolocationPosition } = await import('./getGeolocationPosition');

		const prom = getGeolocationPosition();
		geo.succeedGetOnce(10.12356, 20.98765);
		const pos = await prom;
		expect(pos.coords.latitude).toBeCloseTo(10.124, 3);
		expect(pos.coords.longitude).toBeCloseTo(20.988, 3);
		// cache should make a second call return immediately without new getCurrentPosition
		const p2 = getGeolocationPosition();
		const pos2 = await p2;
		expect(pos2.coords.latitude).toBe(pos.coords.latitude);
		expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
	});

	test('permission denied bubbles error immediately', async () => {
		const geo = buildGeo();
		Object.defineProperty(global.navigator, 'geolocation', { value: geo, configurable: true });
		const { getGeolocationPosition } = await import('./getGeolocationPosition');

		const prom = getGeolocationPosition();
		geo.errorGetOnce({ code: 1, PERMISSION_DENIED: 1, message: 'denied' });
		await expect(prom).rejects.toMatchObject({ code: 1 });
	});

	test('falls back to watchPosition when transient error, then succeeds', async () => {
		const geo = buildGeo();
		Object.defineProperty(global.navigator, 'geolocation', { value: geo, configurable: true });
		const { getGeolocationPosition } = await import('./getGeolocationPosition');

		const prom = getGeolocationPosition();
		// initial getOnce transient failure (POSITION_UNAVAILABLE = 2)
		geo.errorGetOnce({ code: 2, POSITION_UNAVAILABLE: 2, message: 'location unknown' });
		// allow event loop to progress until watchPosition is registered, then emit a fix
		await new Promise((r) => setTimeout(r, 0));
		geo.succeedWatch(11.1111, 22.2222);
		const pos = await prom;
		expect(pos.coords.latitude).toBeCloseTo(11.111, 3);
		expect(pos.coords.longitude).toBeCloseTo(22.222, 3);
		// clearWatch must be called for the watch id 1
		expect(geo.clearWatch).toHaveBeenCalledWith(1);
	});
});
