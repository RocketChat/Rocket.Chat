import { syncUserContacts } from './syncUserContacts';
import type { IExchangeProvider } from '../../definition/IExchangeProvider';
import type { ContactFolder } from '../../definition/types';

const deleteImportedByFolder = jest.fn();
const findFolderIdsByUserId = jest.fn();
const deleteByUserIdAndFolders = jest.fn();
const syncContactFolder = jest.fn();
const deleteFolderContactAvatars = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Contacts: { deleteImportedByFolder: (...args: unknown[]) => deleteImportedByFolder(...args) },
	ExchangeContactSyncState: {
		findFolderIdsByUserId: (...args: unknown[]) => findFolderIdsByUserId(...args),
		deleteByUserIdAndFolders: (...args: unknown[]) => deleteByUserIdAndFolders(...args),
	},
}));

jest.mock('./syncContactFolder', () => ({ syncContactFolder: (...args: unknown[]) => syncContactFolder(...args) }));

jest.mock('./contactAvatars', () => ({ deleteFolderContactAvatars: (...args: unknown[]) => deleteFolderContactAvatars(...args) }));

const UID = 'uid';
const MAILBOX = 'user@corp.example';
const REGION = 'AR';

const outcome = (over: Record<string, unknown> = {}) => ({
	upserted: 0,
	modified: 0,
	deleted: 0,
	pruned: 0,
	failed: false,
	fatal: false,
	...over,
});

const providerListing = (id: 'graph' | 'ews', folders: ContactFolder[]): IExchangeProvider =>
	({
		id,
		capabilities: { supportsWebhooks: false },
		testConnection: jest.fn(),
		listContactFolders: jest.fn(async () => folders),
	}) as unknown as IExchangeProvider;

const folder = (id: string): ContactFolder => ({ id, displayName: id });

describe('syncUserContacts', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		findFolderIdsByUserId.mockResolvedValue([]);
		deleteImportedByFolder.mockResolvedValue({ deletedCount: 0 });
		deleteByUserIdAndFolders.mockResolvedValue({ deletedCount: 0 });
		deleteFolderContactAvatars.mockResolvedValue(undefined);
		syncContactFolder.mockResolvedValue(outcome());
	});

	describe('walking the mailbox folders', () => {
		it('syncs every folder the mailbox lists and adds up what each one did', async () => {
			const provider = providerListing('graph', [folder('default'), folder('Suppliers')]);
			syncContactFolder.mockResolvedValueOnce(outcome({ upserted: 2, pruned: 1 })).mockResolvedValueOnce(outcome({ modified: 3 }));

			const summary = await syncUserContacts(provider, UID, MAILBOX, REGION);

			expect(syncContactFolder).toHaveBeenCalledTimes(2);
			expect(summary).toMatchObject({ folders: 2, upserted: 2, modified: 3, pruned: 1, failed: 0, fatal: false });
		});

		it('counts a failed folder without giving up on the rest', async () => {
			const provider = providerListing('graph', [folder('default'), folder('Suppliers')]);
			syncContactFolder.mockResolvedValueOnce(outcome({ failed: true })).mockResolvedValueOnce(outcome({ upserted: 1 }));

			const summary = await syncUserContacts(provider, UID, MAILBOX, REGION);

			expect(summary).toMatchObject({ failed: 1, upserted: 1, fatal: false });
		});

		it('stops at a fatal folder, since whatever broke it breaks every other folder the same way', async () => {
			const provider = providerListing('graph', [folder('default'), folder('Suppliers')]);
			syncContactFolder.mockResolvedValueOnce(outcome({ failed: true, fatal: true }));

			const summary = await syncUserContacts(provider, UID, MAILBOX, REGION);

			expect(syncContactFolder).toHaveBeenCalledTimes(1);
			expect(deleteImportedByFolder).not.toHaveBeenCalled();
			expect(summary.fatal).toBe(true);
		});
	});

	describe('folders that stopped being listed', () => {
		it('leaves everything alone while every known folder is still there', async () => {
			findFolderIdsByUserId.mockResolvedValue(['default']);

			await syncUserContacts(providerListing('graph', [folder('default')]), UID, MAILBOX, REGION);

			expect(deleteImportedByFolder).not.toHaveBeenCalled();
			expect(deleteByUserIdAndFolders).not.toHaveBeenCalled();
		});

		it('drops the contacts of a folder the user deleted in Outlook', async () => {
			findFolderIdsByUserId.mockResolvedValue(['default', 'Suppliers']);

			await syncUserContacts(providerListing('graph', [folder('default')]), UID, MAILBOX, REGION);

			expect(deleteImportedByFolder).toHaveBeenCalledWith(UID, 'Suppliers');
			expect(deleteByUserIdAndFolders).toHaveBeenCalledWith(UID, ['Suppliers']);
		});

		it('deletes the avatars of a vanished folder before its contacts, which are how the photos are found', async () => {
			findFolderIdsByUserId.mockResolvedValue(['Suppliers']);

			await syncUserContacts(providerListing('graph', []), UID, MAILBOX, REGION);

			expect(deleteFolderContactAvatars).toHaveBeenCalledWith(UID, 'Suppliers');
			expect(deleteFolderContactAvatars.mock.invocationCallOrder[0]).toBeLessThan(deleteImportedByFolder.mock.invocationCallOrder[0]);
		});
	});
});
