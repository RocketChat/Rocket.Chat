import { syncContactFolder } from './syncContactFolder';
import type { IExchangeProvider } from '../../definition/IExchangeProvider';
import type { ExchangeContact, ExchangeContactPhoto, ExchangeContactUpsert, Page } from '../../definition/types';
import { ExchangeError } from '../../errors';

const bulkUpsertImported = jest.fn();
const deleteImportedByExternalIds = jest.fn();
const deleteImportedOutsideSet = jest.fn();
const findImportedByFolder = jest.fn();

const findOneByUserIdAndFolder = jest.fn();
const saveCursor = jest.fn();
const setLastError = jest.fn();
const clearCursor = jest.fn();

const saveContactAvatar = jest.fn();
const deleteContactAvatars = jest.fn();
const deleteFolderContactAvatars = jest.fn();

const settingsGet = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Contacts: {
		bulkUpsertImported: (...args: unknown[]) => bulkUpsertImported(...args),
		deleteImportedByExternalIds: (...args: unknown[]) => deleteImportedByExternalIds(...args),
		deleteImportedOutsideSet: (...args: unknown[]) => deleteImportedOutsideSet(...args),
		findImportedByFolder: (...args: unknown[]) => findImportedByFolder(...args),
	},
	ExchangeContactSyncState: {
		findOneByUserIdAndFolder: (...args: unknown[]) => findOneByUserIdAndFolder(...args),
		saveCursor: (...args: unknown[]) => saveCursor(...args),
		setLastError: (...args: unknown[]) => setLastError(...args),
		clearCursor: (...args: unknown[]) => clearCursor(...args),
	},
}));

jest.mock('../../../../../../server/settings', () => ({ settings: { get: (key: string) => settingsGet(key) } }));

jest.mock('./contactAvatars', () => ({
	saveContactAvatar: (...args: unknown[]) => saveContactAvatar(...args),
	deleteContactAvatars: (...args: unknown[]) => deleteContactAvatars(...args),
	deleteFolderContactAvatars: (...args: unknown[]) => deleteFolderContactAvatars(...args),
}));

const UID = 'uid';
const MAILBOX = 'user@corp.example';
const FOLDER = 'default';
const REGION = 'AR';

const upsert = (externalId: string, over: Partial<ExchangeContactUpsert> = {}): ExchangeContactUpsert => ({
	kind: 'upsert',
	externalId,
	folderId: FOLDER,
	displayName: externalId,
	emails: [],
	phones: [],
	categories: [],
	...over,
});

const deletion = (externalId: string): ExchangeContact => ({ kind: 'deleted', externalId, folderId: FOLDER });

const page = (items: ExchangeContact[], over: Partial<Page<ExchangeContact>> = {}): Page<ExchangeContact> => ({
	items,
	hasMore: false,
	coverage: 'delta',
	...over,
});

const providerReturning = (id: 'graph' | 'ews', ...pages: Page<ExchangeContact>[]): IExchangeProvider => {
	const queue = [...pages];

	return {
		id,
		capabilities: { supportsWebhooks: false },
		testConnection: jest.fn(),
		listContacts: jest.fn(async () => queue.shift() ?? page([])),
		getContactPhotos: jest.fn(async function* () {
			yield* [];
		}),
	} as unknown as IExchangeProvider;
};

const photosOf = (provider: IExchangeProvider, photos: ExchangeContactPhoto[]): void => {
	(provider as any).getContactPhotos = jest.fn(async function* () {
		yield* photos;
	});
};

const photo = (externalId: string): ExchangeContactPhoto => ({
	externalId,
	data: new Uint8Array([1, 2, 3]),
	contentType: 'image/jpeg',
});

/** Rows the folder already holds, which is what the photo pass resolves external ids against. */
const storedContacts = (rows: { _id: string; externalId: string }[]): void => {
	findImportedByFolder.mockReturnValue({
		async *[Symbol.asyncIterator]() {
			yield* rows;
		},
	});
};

const importedExternalIds = (): string[] => (bulkUpsertImported.mock.calls[0][0] as { externalId: string }[]).map((c) => c.externalId);

const importedPhones = () => (bulkUpsertImported.mock.calls[0][0] as { phones: unknown[] }[])[0].phones;

const syncedState = (over: Record<string, unknown> = {}) => ({
	cursor: 'saved',
	mailbox: MAILBOX,
	provider: 'graph',
	...over,
});

describe('syncContactFolder', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		findOneByUserIdAndFolder.mockResolvedValue(null);
		bulkUpsertImported.mockResolvedValue({ matchedCount: 0, modifiedCount: 0, upsertedCount: 0 });
		deleteImportedByExternalIds.mockResolvedValue({ deletedCount: 0 });
		deleteImportedOutsideSet.mockResolvedValue({ deletedCount: 0 });
		saveCursor.mockResolvedValue(undefined);
		setLastError.mockResolvedValue(undefined);
		clearCursor.mockResolvedValue(undefined);
		settingsGet.mockReturnValue(false);
		storedContacts([]);
	});

	describe('reusing a stored cursor', () => {
		it('resumes from it when the mailbox and the provider are the ones that produced it', async () => {
			findOneByUserIdAndFolder.mockResolvedValue(syncedState());
			const provider = providerReturning('graph', page([upsert('A')]));

			await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

			expect(provider.listContacts).toHaveBeenCalledWith(MAILBOX, FOLDER, 'saved');
		});

		it('reads from scratch after a provider switch, whose ids and cursor mean nothing to the new one', async () => {
			findOneByUserIdAndFolder.mockResolvedValue(syncedState({ provider: 'ews' }));
			const provider = providerReturning('graph', page([upsert('A')]));

			await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

			expect(provider.listContacts).toHaveBeenCalledWith(MAILBOX, FOLDER, undefined);
		});

		it('reads from scratch when the mailbox behind the folder changed', async () => {
			findOneByUserIdAndFolder.mockResolvedValue(syncedState({ mailbox: 'someone.else@corp.example' }));
			const provider = providerReturning('graph', page([upsert('A')]));

			await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

			expect(provider.listContacts).toHaveBeenCalledWith(MAILBOX, FOLDER, undefined);
		});
	});

	describe('resolving upserts against removals', () => {
		it('lets a later upsert win over an earlier deletion of the same contact', async () => {
			const provider = providerReturning('ews', page([deletion('A')], { hasMore: true, cursor: 'c1' }), page([upsert('A')]));

			await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

			expect(importedExternalIds()).toEqual(['A']);
			expect(deleteImportedByExternalIds).not.toHaveBeenCalled();
		});

		it('lets a later deletion win over an earlier upsert of the same contact', async () => {
			const provider = providerReturning('ews', page([upsert('A')], { hasMore: true, cursor: 'c1' }), page([deletion('A')]));

			await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

			expect(importedExternalIds()).toEqual([]);
			expect(deleteImportedByExternalIds).toHaveBeenCalledWith(UID, FOLDER, ['A']);
		});
	});

	describe('deciding what may be pruned', () => {
		it('prunes against everything a read from scratch collected, which no single page can claim on its own', async () => {
			const provider = providerReturning('ews', page([upsert('A')], { hasMore: true, cursor: 'c1' }), page([upsert('B')]));

			await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

			expect(deleteImportedOutsideSet).toHaveBeenCalledWith(UID, FOLDER, ['A', 'B']);
		});

		it('never prunes a delta resumed from a stored cursor, which carries changes rather than the folder', async () => {
			findOneByUserIdAndFolder.mockResolvedValue(syncedState());
			const provider = providerReturning('graph', page([upsert('A')]));

			await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

			expect(deleteImportedOutsideSet).not.toHaveBeenCalled();
		});

		it('never prunes when a provider came up short, because the collection is missing contacts it still holds', async () => {
			const provider = providerReturning('ews', page([upsert('A')], { coverage: 'partial' }));

			await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

			expect(deleteImportedOutsideSet).not.toHaveBeenCalled();
		});

		it('drops the avatars of the pruned contacts first, since the contacts are what the photos are reached through', async () => {
			const provider = providerReturning('ews', page([upsert('A')]));

			await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

			expect(deleteFolderContactAvatars).toHaveBeenCalledWith(UID, FOLDER, { notIn: ['A'] });
			expect(deleteFolderContactAvatars.mock.invocationCallOrder[0]).toBeLessThan(deleteImportedOutsideSet.mock.invocationCallOrder[0]);
		});

		it('drops the avatars of the removed contacts before the contacts themselves', async () => {
			findOneByUserIdAndFolder.mockResolvedValue(syncedState());
			const provider = providerReturning('graph', page([deletion('A')]));

			await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

			expect(deleteFolderContactAvatars).toHaveBeenCalledWith(UID, FOLDER, { in: ['A'] });
			expect(deleteFolderContactAvatars.mock.invocationCallOrder[0]).toBeLessThan(deleteImportedByExternalIds.mock.invocationCallOrder[0]);
		});
	});

	describe('mapping a contact for storage', () => {
		it('keys a national number off the configured region while keeping what Exchange sent', async () => {
			const provider = providerReturning('graph', page([upsert('A', { phones: [{ raw: '011 4321-1000', label: 'work' }] })]));

			await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

			expect(importedPhones()).toEqual([{ raw: '011 4321-1000', e164: '+541143211000', label: 'work' }]);
		});

		it('leaves a number it cannot resolve without a e164 key, so it never matches the wrong contact', async () => {
			const provider = providerReturning('graph', page([upsert('A', { phones: [{ raw: 'ext. 204' }] })]));

			await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

			expect(importedPhones()).toEqual([{ raw: 'ext. 204' }]);
		});
	});

	describe('gathering photos', () => {
		describe('with Exchange_Contacts_Sync_Avatars enabled', () => {
			beforeEach(() => {
				settingsGet.mockReturnValue(true);
			});

			it('covers the whole folder the first time the setting is on, which a delta would never bring back', async () => {
				findOneByUserIdAndFolder.mockResolvedValue(syncedState());
				storedContacts([{ _id: 'c1', externalId: 'A' }]);
				const provider = providerReturning('graph', page([]));

				await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

				expect(findImportedByFolder).toHaveBeenCalledWith(UID, FOLDER, undefined, expect.anything());
				expect(provider.getContactPhotos).toHaveBeenCalledWith(MAILBOX, ['A']);
			});

			it('asks only for what changed once the folder has been covered', async () => {
				findOneByUserIdAndFolder.mockResolvedValue(syncedState({ avatarsSyncedAt: new Date() }));
				storedContacts([{ _id: 'c1', externalId: 'A' }]);
				const provider = providerReturning('graph', page([upsert('A')]));

				await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

				expect(findImportedByFolder).toHaveBeenCalledWith(UID, FOLDER, { in: ['A'] }, expect.anything());
			});

			it('keeps the folder marked as covered, so the sweep does not come back on the next run', async () => {
				findOneByUserIdAndFolder.mockResolvedValue(syncedState({ avatarsSyncedAt: new Date() }));
				storedContacts([{ _id: 'c1', externalId: 'A' }]);
				const provider = providerReturning('graph', page([upsert('A')]));

				await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

				expect(saveCursor.mock.calls[0][5]).toBeInstanceOf(Date);
			});

			it('skips the pass entirely when nothing changed and the folder is already covered', async () => {
				findOneByUserIdAndFolder.mockResolvedValue(syncedState({ avatarsSyncedAt: new Date() }));
				const provider = providerReturning('graph', page([]));

				await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

				expect(provider.getContactPhotos).not.toHaveBeenCalled();
			});

			it('stores the photo against the contact it belongs to', async () => {
				storedContacts([{ _id: 'c1', externalId: 'A' }]);
				const provider = providerReturning('graph', page([upsert('A')], { coverage: 'full' }));
				photosOf(provider, [photo('A')]);

				await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

				expect(saveContactAvatar).toHaveBeenCalledWith(UID, 'c1', photo('A'));
			});

			it('drops the avatar of a contact whose photo was taken down in Exchange', async () => {
				storedContacts([
					{ _id: 'c1', externalId: 'A' },
					{ _id: 'c2', externalId: 'B' },
				]);
				const provider = providerReturning('graph', page([upsert('A'), upsert('B')], { coverage: 'full' }));
				photosOf(provider, [photo('A')]);

				await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

				expect(deleteContactAvatars).toHaveBeenCalledWith(['c2']);
			});
		});

		describe('with Exchange_Contacts_Sync_Avatars disabled', () => {
			it('clears the photos it had gathered once the setting is turned off', async () => {
				findOneByUserIdAndFolder.mockResolvedValue(syncedState({ avatarsSyncedAt: new Date() }));
				const provider = providerReturning('graph', page([]));

				await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

				expect(deleteFolderContactAvatars).toHaveBeenCalledWith(UID, FOLDER);
			});

			it('leaves the mailbox alone when the setting was never on', async () => {
				findOneByUserIdAndFolder.mockResolvedValue(syncedState());
				storedContacts([{ _id: 'c1', externalId: 'A' }]);
				const provider = providerReturning('graph', page([upsert('A')]));

				await syncContactFolder(provider, UID, MAILBOX, FOLDER, REGION);

				expect(provider.getContactPhotos).not.toHaveBeenCalled();
				expect(deleteFolderContactAvatars).not.toHaveBeenCalled();
			});
		});
	});

	describe('when a read fails', () => {
		const failingProvider = (err: unknown): IExchangeProvider =>
			({
				id: 'graph',
				capabilities: { supportsWebhooks: false },
				testConnection: jest.fn(),
				listContacts: jest.fn(async () => {
					throw err;
				}),
				getContactPhotos: jest.fn(),
			}) as unknown as IExchangeProvider;

		it('discards a cursor the server no longer accepts, so the next run reads from scratch', async () => {
			const outcome = await syncContactFolder(
				failingProvider(new ExchangeError('sync-state-invalid', 'stale token')),
				UID,
				MAILBOX,
				FOLDER,
				REGION,
			);

			expect(clearCursor).toHaveBeenCalledWith(UID, FOLDER);
			expect(outcome.failed).toBe(true);
		});

		it('reports a credential failure as fatal, since every other mailbox would fail the same way', async () => {
			const outcome = await syncContactFolder(
				failingProvider(new ExchangeError('authentication-failed', 'bad secret')),
				UID,
				MAILBOX,
				FOLDER,
				REGION,
			);

			expect(outcome).toMatchObject({ failed: true, fatal: true });
			expect(clearCursor).not.toHaveBeenCalled();
		});

		it('leaves the stored cursor untouched, so a failed run never looks like a completed one', async () => {
			await syncContactFolder(failingProvider(new Error('socket hang up')), UID, MAILBOX, FOLDER, REGION);

			expect(saveCursor).not.toHaveBeenCalled();
			expect(setLastError).toHaveBeenCalledWith(UID, FOLDER, { mailbox: MAILBOX, provider: 'graph' }, expect.stringContaining('unknown'));
		});
	});
});
