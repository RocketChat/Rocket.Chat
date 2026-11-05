import type { IUser } from '@rocket.chat/core-typings';
import { Contacts, ExchangeContactSyncState } from '@rocket.chat/models';

import { deleteFolderContactAvatars } from './contactAvatars';
import { syncContactFolder } from './syncContactFolder';
import type { IExchangeProvider } from '../../definition/IExchangeProvider';
import { FATAL_CODES, isExchangeError } from '../../errors';
import { logger } from '../../logger';
import { scrubForLog } from '../../scrub';

export type UserContactSyncOutcome = {
	folders: number;
	upserted: number;
	modified: number;
	deleted: number;
	pruned: number;
	failed: number;
	fatal: boolean;
	error?: unknown;
};

const EMPTY: UserContactSyncOutcome = { folders: 0, upserted: 0, modified: 0, deleted: 0, pruned: 0, failed: 0, fatal: false };

/**
 * A folder the user deleted stops being listed, and its contacts would otherwise sit here forever
 */
const dropVanishedFolders = async (uid: IUser['_id'], liveFolderIds: string[]): Promise<void> => {
	const known = await ExchangeContactSyncState.findFolderIdsByUserId(uid);
	const vanished = known.filter((folderId) => !liveFolderIds.includes(folderId));

	if (!vanished.length) {
		return;
	}

	for (const folderId of vanished) {
		await deleteFolderContactAvatars(uid, folderId);
		await Contacts.deleteImportedByFolder(uid, folderId);
	}

	await ExchangeContactSyncState.deleteByUserIdAndFolders(uid, vanished);

	logger.info({ msg: 'Dropped Exchange contact folders that are no longer in the mailbox', uid, folders: vanished.length });
};

export const syncUserContacts = async (
	provider: IExchangeProvider,
	uid: IUser['_id'],
	mailbox: string,
	defaultRegion: string,
): Promise<UserContactSyncOutcome> => {
	const summary: UserContactSyncOutcome = { ...EMPTY };

	try {
		const { folders, complete } = await provider.listContactFolders(mailbox);

		summary.folders = folders.length;

		for (const folder of folders) {
			const outcome = await syncContactFolder(provider, uid, mailbox, folder.id, defaultRegion);

			summary.upserted += outcome.upserted;
			summary.modified += outcome.modified;
			summary.deleted += outcome.deleted;
			summary.pruned += outcome.pruned;

			if (outcome.failed) {
				summary.failed++;
				summary.error = summary.error ?? outcome.error;
			}

			if (outcome.fatal) {
				summary.fatal = true;
				return summary;
			}
		}

		if (complete) {
			await dropVanishedFolders(
				uid,
				folders.map(({ id }) => id),
			);
		}

		return summary;
	} catch (err) {
		const code = isExchangeError(err) ? err.code : 'unknown';

		logger.warn({ msg: 'Exchange contact sync failed for a mailbox', uid, code, err: scrubForLog(err) });

		return { ...summary, failed: summary.failed + 1, fatal: FATAL_CODES.has(code), error: summary.error ?? err };
	}
};
