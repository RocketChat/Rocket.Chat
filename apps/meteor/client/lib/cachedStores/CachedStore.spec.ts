import { PrivateCachedStore } from './CachedStore';
import { createDocumentMapStore } from './DocumentMapStore';
import { STORAGE_KEYS } from '../sdk/storage';

const mockCall = jest.fn();
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();

jest.mock('localforage', () => ({
	config: jest.fn(),
	getItem: (...args: unknown[]) => mockGetItem(...args),
	setItem: (...args: unknown[]) => mockSetItem(...args),
	removeItem: (...args: unknown[]) => mockRemoveItem(...args),
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

type TestRecord = { _id: string; rid: string; _updatedAt: Date; lastMessage?: Record<string, unknown> };

class TestCachedStore extends PrivateCachedStore<TestRecord> {
	constructor() {
		super({ name: 'subscriptions', eventType: 'notify-user', store: createDocumentMapStore<TestRecord>() });
		createdStores.push(this);
	}

	clear() {
		return this.clearCache();
	}
}

// Each store saves its cache 1 second after a change. A save of a previous test must not land in the next test.
const createdStores: TestCachedStore[] = [];
const cancelPendingSaves = () => {
	for (const cachedStore of createdStores.splice(0)) {
		(cachedStore as unknown as { save: { cancel(): void } }).save.cancel();
	}
};

const recordsOf = (cachedStore: TestCachedStore) => Array.from(cachedStore.store.getState().records.values());

describe('CachedStore', () => {
	const stale = { _id: 'sub-old', rid: 'GENERAL', _updatedAt: new Date(1) };
	const fresh = { _id: 'sub-new', rid: 'GENERAL', _updatedAt: new Date(2) };

	beforeEach(() => {
		mockCall.mockReset();
		mockGetItem.mockReset().mockResolvedValue(null);
		mockSetItem.mockReset().mockResolvedValue(undefined);
		mockRemoveItem.mockReset().mockResolvedValue(undefined);
		localStorage.clear();
	});

	afterEach(cancelPendingSaves);

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

	describe('end-to-end encrypted last messages', () => {
		const savedRecords = async () => {
			for (let i = 0; i < 40 && mockSetItem.mock.calls.length === 0; i++) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
			expect(mockSetItem).toHaveBeenCalled();
			return (mockSetItem.mock.calls.at(-1)?.[1] as { records: TestRecord[] }).records;
		};

		const encryptedContent = { algorithm: 'rc.v2.aes-sha2', kid: 'kid-1', iv: 'iv-1', ciphertext: 'CIPHERTEXT' };

		it('never writes the decrypted text of an encrypted last message to the persistent cache', async () => {
			const cachedStore = new TestCachedStore();
			mockCall.mockResolvedValue([
				{
					...fresh,
					lastMessage: {
						_id: 'msg-1',
						rid: 'GENERAL',
						ts: new Date(3),
						u: { _id: 'user-1', username: 'alice' },
						t: 'e2e',
						e2e: 'done',
						content: encryptedContent,
						msg: 'the okapi plaintext',
						attachments: [{ description: 'okapi attachment' }],
						files: [{ name: 'okapi.png' }],
						file: { name: 'okapi.png' },
					},
				},
			]);

			await cachedStore.init();
			const records = await savedRecords();

			expect(JSON.stringify(records)).not.toContain('okapi');
			expect(records[0].lastMessage).toMatchObject({ _id: 'msg-1', t: 'e2e', e2e: 'pending', content: encryptedContent });
			// The decrypted text stays in memory for the UI.
			expect(recordsOf(cachedStore)[0].lastMessage).toMatchObject({ msg: 'the okapi plaintext', e2e: 'done' });
		});

		it('drops an old-format encrypted last message whose ciphertext the decryption replaced', async () => {
			const cachedStore = new TestCachedStore();
			mockCall.mockResolvedValue([
				{ ...fresh, lastMessage: { _id: 'msg-2', rid: 'GENERAL', t: 'e2e', e2e: 'done', msg: 'the okapi plaintext' } },
			]);

			await cachedStore.init();
			const records = await savedRecords();

			expect(JSON.stringify(records)).not.toContain('okapi');
			expect(records[0].lastMessage).toBeUndefined();
		});

		it('rewrites a cache that an old client left on disk when the store starts, with no login and no server call', async () => {
			const cache = {
				version: 19,
				token: 'token-of-an-old-session',
				updatedAt: new Date(5),
				records: [
					{
						...fresh,
						lastMessage: { _id: 'msg-4', rid: 'GENERAL', t: 'e2e', e2e: 'done', content: encryptedContent, msg: 'the okapi plaintext' },
					},
					{ ...stale, lastMessage: { _id: 'msg-5', rid: 'GENERAL', t: 'e2e', e2e: 'done', msg: 'old format okapi' } },
				],
			};
			mockGetItem.mockResolvedValue(cache);

			new TestCachedStore();
			const records = await savedRecords();

			expect(mockSetItem.mock.calls[0][0]).toBe('subscriptions');
			expect(JSON.stringify(records)).not.toContain('okapi');
			expect(records[0].lastMessage).toMatchObject({ _id: 'msg-4', e2e: 'pending', content: encryptedContent });
			expect(records[1].lastMessage).toBeUndefined();
			expect(mockSetItem.mock.calls[0][1]).toMatchObject({ version: 19, token: 'token-of-an-old-session', updatedAt: new Date(5) });
			expect(mockCall).not.toHaveBeenCalled();
		});

		it('does not write a cache that holds no decrypted text', async () => {
			mockGetItem.mockResolvedValue({
				version: 19,
				token: 't',
				updatedAt: new Date(5),
				records: [{ ...fresh, lastMessage: { _id: 'msg-6', rid: 'GENERAL', t: 'e2e', e2e: 'pending', content: encryptedContent } }],
			});

			new TestCachedStore();
			await new Promise((resolve) => setTimeout(resolve, 200));

			expect(mockSetItem).not.toHaveBeenCalled();
		});

		it('keeps the server markers of deleted files of an encrypted last message that is not decrypted', async () => {
			const cachedStore = new TestCachedStore();
			const removedFile = { type: 'removed-file', color: 'grey', text: '_File removed_', fileId: 'file-1' };
			mockCall.mockResolvedValue([
				{
					...fresh,
					lastMessage: { _id: 'msg-7', rid: 'GENERAL', t: 'e2e', e2e: 'pending', content: encryptedContent, attachments: [removedFile] },
				},
			]);

			await cachedStore.init();
			const records = await savedRecords();

			expect(records[0].lastMessage).toMatchObject({ _id: 'msg-7', e2e: 'pending', content: encryptedContent, attachments: [removedFile] });
		});

		it('writes no attachment of a decrypted last message, also one that looks like a marker of a deleted file', async () => {
			const cachedStore = new TestCachedStore();
			mockCall.mockResolvedValue([
				{
					...fresh,
					lastMessage: {
						_id: 'msg-8',
						rid: 'GENERAL',
						t: 'e2e',
						e2e: 'done',
						content: encryptedContent,
						attachments: [{ type: 'removed-file', text: 'okapi' }, { title: 'okapi.png' }],
					},
				},
			]);

			await cachedStore.init();
			const records = await savedRecords();

			expect(JSON.stringify(records)).not.toContain('okapi');
			expect(records[0].lastMessage).not.toHaveProperty('attachments');
		});

		it('removes the cache on logout only after the startup rewrite, so the rewrite cannot bring the cache back', async () => {
			mockGetItem.mockResolvedValue({
				version: 19,
				token: 't',
				updatedAt: new Date(5),
				records: [{ ...fresh, lastMessage: { _id: 'msg-9', rid: 'GENERAL', t: 'e2e', e2e: 'done', msg: 'old format okapi' } }],
			});
			let finishRewrite: () => void = () => undefined;
			mockSetItem.mockReturnValue(
				new Promise<void>((resolve) => {
					finishRewrite = resolve;
				}),
			);

			const cachedStore = new TestCachedStore();
			for (let i = 0; i < 20 && mockSetItem.mock.calls.length === 0; i++) {
				await new Promise((resolve) => setTimeout(resolve, 0));
			}
			expect(mockSetItem).toHaveBeenCalledTimes(1);

			const clearing = cachedStore.clear();
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(mockRemoveItem).not.toHaveBeenCalled();

			finishRewrite();
			await clearing;
			expect(mockRemoveItem).toHaveBeenCalledWith('subscriptions');
		});

		it('keeps the last message of a room that is not encrypted', async () => {
			const cachedStore = new TestCachedStore();
			const lastMessage = { _id: 'msg-3', rid: 'GENERAL', msg: 'a public okapi' };
			mockCall.mockResolvedValue([{ ...fresh, lastMessage }]);

			await cachedStore.init();
			const records = await savedRecords();

			expect(records[0].lastMessage).toEqual(lastMessage);
		});
	});
});
