import type { LoggedSettingsCachedStore as LoggedSettingsCachedStoreInstance } from './LoggedSettingsCachedStore';
import { STORAGE_KEYS } from '../lib/sdk/storage';
import type { userIdStore as UserIdStore } from '../lib/user';

const mockGet = jest.fn();
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();
const mockStreamHandlers = new Map<string, () => void>();

jest.mock('localforage', () => ({
	config: jest.fn(),
	getItem: (...args: unknown[]) => mockGetItem(...args),
	setItem: (...args: unknown[]) => mockSetItem(...args),
	removeItem: (...args: unknown[]) => mockRemoveItem(...args),
}));

jest.mock('../lib/SDKClient', () => ({
	sdk: {
		rest: { get: (...args: unknown[]) => mockGet(...args) },
		stream: jest.fn((_streamName: string, [eventName]: string[], callback: () => void) => {
			mockStreamHandlers.set(eventName, callback);
			return { stop: jest.fn() };
		}),
	},
}));

jest.mock('../lib/sdk/ddpSdk', () => ({
	getDdpSdk: () => ({
		connection: { status: 'connected', on: jest.fn(() => () => undefined) },
		account: { onLogin: jest.fn(() => () => undefined), onLogout: jest.fn(() => () => undefined) },
	}),
}));

jest.mock('../meteor/connection', () => ({
	hasPendingMethods: () => false,
}));

const serializedSetting = (_id: string, value: string) => ({ _id, value, _updatedAt: '2026-01-01T00:00:00.000Z' });

const cachedSetting = (_id: string, value: string) => ({ _id, value, _updatedAt: new Date('2026-01-01T00:00:00.000Z') });

describe('LoggedSettingsCachedStore', () => {
	let cachedStore: typeof LoggedSettingsCachedStoreInstance;
	let userIdStore: typeof UserIdStore;

	const recordsOf = () => Array.from(cachedStore.store.getState().records.values());

	const cacheWith = (records: unknown[], cacheKey: string) => ({
		version: Number.MAX_SAFE_INTEGER,
		token: 'login-token',
		records,
		updatedAt: new Date(),
		metadata: { cacheKey },
	});

	beforeEach(() => {
		jest.useFakeTimers();
		mockGet.mockReset();
		mockGetItem.mockReset().mockResolvedValue(null);
		mockSetItem.mockReset().mockResolvedValue(undefined);
		mockRemoveItem.mockReset().mockResolvedValue(undefined);
		mockStreamHandlers.clear();
		localStorage.clear();
		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'login-token');

		jest.isolateModules(() => {
			({ LoggedSettingsCachedStore: cachedStore } =
				jest.requireActual<typeof import('./LoggedSettingsCachedStore')>('./LoggedSettingsCachedStore'));
			({ userIdStore } = jest.requireActual<typeof import('../lib/user')>('../lib/user'));
		});
		userIdStore.setState('user-id');
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('loads the settings over REST and saves the cacheKey with the browser cache', async () => {
		mockGet.mockResolvedValue({ update: [serializedSetting('Logged_Setting', 'a')], remove: [], cacheKey: 'key-1', reset: true });

		await cachedStore.init();
		await jest.advanceTimersByTimeAsync(1000);

		expect(mockGet).toHaveBeenCalledWith('/v1/settings.loggedIn', {});
		expect(recordsOf()).toEqual([cachedSetting('Logged_Setting', 'a')]);
		expect(mockSetItem).toHaveBeenCalledWith('logged-settings', expect.objectContaining({ metadata: { cacheKey: 'key-1' } }));
	});

	it('paints from the browser cache and sends its cacheKey on the delta sync', async () => {
		mockGetItem.mockResolvedValue(cacheWith([cachedSetting('Logged_Setting', 'a')], 'key-1'));
		mockGet.mockResolvedValue({ update: [], remove: [], cacheKey: 'key-1', reset: false });

		await cachedStore.init();

		expect(recordsOf()).toEqual([cachedSetting('Logged_Setting', 'a')]);

		await jest.advanceTimersByTimeAsync(10);

		expect(mockGet).toHaveBeenCalledWith('/v1/settings.loggedIn', { updatedSince: expect.any(String), cacheKey: 'key-1' });
	});

	it('replaces every record when the server answers the sync with a reset', async () => {
		mockGetItem.mockResolvedValue(cacheWith([cachedSetting('Logged_Setting', 'a'), cachedSetting('Other_Setting', 'b')], 'key-1'));
		mockGet.mockResolvedValue({ update: [serializedSetting('Logged_Setting', 'masked')], remove: [], cacheKey: 'key-2', reset: true });

		await cachedStore.init();
		await jest.advanceTimersByTimeAsync(10);

		expect(recordsOf()).toEqual([cachedSetting('Logged_Setting', 'masked')]);
	});

	it('syncs with the saved cacheKey when the license changes', async () => {
		mockGet.mockResolvedValue({ update: [serializedSetting('Logged_Setting', 'a')], remove: [], cacheKey: 'key-1', reset: true });
		await cachedStore.init();
		mockGet.mockClear();

		mockStreamHandlers.get('license')?.();
		await jest.advanceTimersByTimeAsync(10);

		expect(mockGet).toHaveBeenCalledWith('/v1/settings.loggedIn', { updatedSince: expect.any(String), cacheKey: 'key-1' });
	});

	it('does not request the settings when nobody is signed in', async () => {
		mockGet.mockResolvedValue({ update: [serializedSetting('Logged_Setting', 'a')], remove: [], cacheKey: 'key-1', reset: true });
		await cachedStore.init();
		mockGet.mockClear();
		userIdStore.setState(undefined);

		mockStreamHandlers.get('license')?.();
		await jest.advanceTimersByTimeAsync(10);

		expect(mockGet).not.toHaveBeenCalled();
	});

	it('drops the records, the browser cache and the cacheKey on logout', async () => {
		mockGet.mockResolvedValue({ update: [serializedSetting('Logged_Setting', 'a')], remove: [], cacheKey: 'key-1', reset: true });
		await cachedStore.init();
		mockGet.mockClear();

		cachedStore.clearCacheOnLogout();
		await jest.advanceTimersByTimeAsync(0);

		expect(mockRemoveItem).toHaveBeenCalledWith('logged-settings');
		expect(recordsOf()).toEqual([]);

		mockStreamHandlers.get('license')?.();
		await jest.advanceTimersByTimeAsync(10);

		expect(mockGet).toHaveBeenCalledWith('/v1/settings.loggedIn', { updatedSince: expect.any(String) });
	});
});
