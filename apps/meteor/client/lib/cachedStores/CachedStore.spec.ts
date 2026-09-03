import { PrivateCachedStore } from './CachedStore';
import { createDocumentMapStore } from './DocumentMapStore';

const mockCall = jest.fn();

jest.mock('localforage', () => ({
	config: jest.fn(),
	getItem: jest.fn().mockResolvedValue(null),
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

describe('CachedStore', () => {
	it('drops records left in memory by a previous session when loading from the server after a cache miss', async () => {
		const cachedStore = new TestCachedStore();
		const stale = { _id: 'sub-old', rid: 'GENERAL', _updatedAt: new Date(1) };
		const fresh = { _id: 'sub-new', rid: 'GENERAL', _updatedAt: new Date(2) };
		cachedStore.store.getState().store(stale);
		mockCall.mockResolvedValue([fresh]);

		await cachedStore.init();

		expect(Array.from(cachedStore.store.getState().records.values())).toEqual([fresh]);
	});
});
