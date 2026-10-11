import { PrivateCachedStore } from './CachedStore';
import { createDocumentMapStore } from './DocumentMapStore';
import { STORAGE_KEYS } from '../sdk/storage';

const mockCall = jest.fn();
const mockGetItem = jest.fn();

jest.mock('localforage', () => ({
	config: jest.fn(),
	getItem: (...args: unknown[]) => mockGetItem(...args),
	setItem: jest.fn().mockResolvedValue(undefined),
	removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../SDKClient', () => ({
	sdk: {
		call: (...args: unknown[]) => mockCall(...args),
		stream: jest.fn(() => ({ stop: jest.fn() })),
	},
}));

jest.mock('../sdk/ddpSdk', () => ({
	getDdpSdk: () => ({
		connection: { status: 'connected', on: jest.fn(() => () => undefined) },
		account: { onLogin: jest.fn(() => () => undefined), onLogout: jest.fn(() => () => undefined) },
	}),
}));

type TestRecord = { _id: string; rid: string; _updatedAt: Date };

class TestCachedStore extends PrivateCachedStore<TestRecord> {
	constructor() {
		super({ name: 'subscriptions', eventType: 'notify-user', store: createDocumentMapStore<TestRecord>() });
	}
}

const recordsOf = (cachedStore: TestCachedStore) => Array.from(cachedStore.store.getState().records.values());

describe('CachedStore', () => {
	const stale = { _id: 'sub-old', rid: 'GENERAL', _updatedAt: new Date(1) };
	const fresh = { _id: 'sub-new', rid: 'GENERAL', _updatedAt: new Date(2) };

	beforeEach(() => {
		mockCall.mockReset();
		mockGetItem.mockReset().mockResolvedValue(null);
		localStorage.clear();
	});

	it('drops records left in memory by a previous session when loading from the server after a cache miss', async () => {
		const cachedStore = new TestCachedStore();
		cachedStore.store.getState().store(stale);
		mockCall.mockResolvedValue([fresh]);

		await cachedStore.init();

		expect(recordsOf(cachedStore)).toEqual([fresh]);
	});

	it('drops them when the cache belongs to a previous session, which is what a deleted user leaves behind', async () => {
		const cachedStore = new TestCachedStore();
		cachedStore.store.getState().store(stale);
		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'token-of-the-current-session');
		mockGetItem.mockResolvedValue({
			// Above the store's own version, so the token is what decides this case.
			version: Number.MAX_SAFE_INTEGER,
			token: 'token-of-the-deleted-user',
			records: [stale],
			updatedAt: new Date(),
		});
		mockCall.mockResolvedValue([fresh]);

		await cachedStore.init();

		expect(recordsOf(cachedStore)).toEqual([fresh]);
	});

	it('keeps the records it has while the load is in flight, so the UI is never blanked waiting on the response', async () => {
		const cachedStore = new TestCachedStore();
		cachedStore.store.getState().store(stale);
		let respond: (records: TestRecord[]) => void = () => undefined;
		mockCall.mockReturnValue(
			new Promise<TestRecord[]>((resolve) => {
				respond = resolve;
			}),
		);

		const initialization = cachedStore.init();
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(recordsOf(cachedStore)).toEqual([stale]);

		respond([fresh]);
		await initialization;

		expect(recordsOf(cachedStore)).toEqual([fresh]);
	});

	it('keeps the records it has when the load fails, instead of blanking the store over a network error', async () => {
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const cachedStore = new TestCachedStore();
		cachedStore.store.getState().store(stale);
		const error = new Error('offline');
		mockCall.mockRejectedValue(error);

		await cachedStore.init();

		expect(recordsOf(cachedStore)).toEqual([stale]);
		expect(consoleError).toHaveBeenCalledWith(error);
		consoleError.mockRestore();
	});
});
