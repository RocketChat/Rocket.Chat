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

	it('normalizes non-string _id representations and prevents duplicate records when merging equivalent IDs', async () => {
		const cachedStore = new TestCachedStore();
		const hexId = '6a7fc7b8376b837b4b8aa6c3';
		const base64Id = 'an/HuDdrg3tLiqbD';

		// Store initial record with string _id
		const initialRecord = { _id: hexId, rid: 'GENERAL', _updatedAt: new Date(10) };
		cachedStore.store.getState().store(initialRecord);

		// Incoming server record has EJSON binary buffer representation of the same ObjectId
		const incomingRecord = {
			_id: { buffer: { $binary: base64Id } } as unknown as string,
			rid: 'GENERAL',
			_updatedAt: new Date(20),
		};
		mockCall.mockResolvedValue([incomingRecord]);

		await cachedStore.init();

		const records = recordsOf(cachedStore);
		expect(records).toHaveLength(1);
		expect(records[0]._id).toBe(hexId);
		expect(records[0]._updatedAt).toEqual(new Date(20));
		expect(cachedStore.store.getState().has(hexId)).toBe(true);
	});

	it('deduplicates equivalent non-string and string records restored from persistent cache', async () => {
		const cachedStore = new TestCachedStore();
		const hexId = '6a7fc7b8376b837b4b8aa6c3';
		const base64Id = 'an/HuDdrg3tLiqbD';

		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'test-token');
		mockGetItem.mockResolvedValue({
			version: 19,
			token: 'test-token',
			records: [
				{ _id: hexId, rid: 'GENERAL', _updatedAt: new Date(10) },
				{ _id: { buffer: { $binary: base64Id } }, rid: 'GENERAL', _updatedAt: new Date(20) },
			],
			updatedAt: new Date(),
		});

		await cachedStore.init();

		const records = recordsOf(cachedStore);
		expect(records).toHaveLength(1);
		expect(records[0]._id).toBe(hexId);
		expect(records[0]._updatedAt).toEqual(new Date(20));
	});

	it('correctly retrieves and deletes records using non-string ID representations', () => {
		const cachedStore = new TestCachedStore();
		const hexId = '6a7fc7b8376b837b4b8aa6c3';
		const record = { _id: hexId, rid: 'GENERAL', _updatedAt: new Date(1) };

		cachedStore.store.getState().store(record);
		expect(cachedStore.store.getState().has({ toHexString: () => hexId } as unknown as string)).toBe(true);
		expect(cachedStore.store.getState().get({ toHexString: () => hexId } as unknown as string)).toEqual(record);

		cachedStore.store.getState().delete({ toHexString: () => hexId } as unknown as string);
		expect(cachedStore.store.getState().has(hexId)).toBe(false);
		expect(recordsOf(cachedStore)).toHaveLength(0);
	});

	it('preserves distinct records when IDs are different', async () => {
		const cachedStore = new TestCachedStore();
		const id1 = '6a7fc7b8376b837b4b8aa6c3';
		const id2 = 'ffffffffffffffffffffffff';
		const record1 = { _id: id1, rid: 'ROOM1', _updatedAt: new Date(1) };
		const record2 = { _id: { toHexString: () => id2 } as unknown as string, rid: 'ROOM2', _updatedAt: new Date(2) };

		mockCall.mockResolvedValue([record1, record2]);
		await cachedStore.init();

		const records = recordsOf(cachedStore);
		expect(records).toHaveLength(2);
		expect(cachedStore.store.getState().has(id1)).toBe(true);
		expect(cachedStore.store.getState().has(id2)).toBe(true);
	});
});
