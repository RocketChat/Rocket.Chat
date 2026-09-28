import { ExchangeContactSyncState } from '@rocket.chat/models';

import { forEachWithConcurrency } from '../forEachWithConcurrency';
import { MAILBOX_CONCURRENCY } from '../limits';
import { iterateMailboxCandidates } from '../resolveMailboxes';
import { syncUserContacts } from './syncUserContacts';
import { settings } from '../../../../../../server/settings';
import { getExchangeProvider, isServerSyncEnabled } from '../../ExchangeProviderRegistry';
import { isExchangeError } from '../../errors';
import { logger } from '../../logger';

const DAY_MS = 24 * 60 * 60 * 1000;

const MIN_INTERVAL_DAYS = 1;

export type ContactSyncRunSummary = {
	mailboxes: number;
	skipped: number;
	notDue: number;
	folders: number;
	upserted: number;
	modified: number;
	deleted: number;
	pruned: number;
	failed: number;
	aborted: boolean;
};

let running = false;

export const runContactSync = async (): Promise<ContactSyncRunSummary> => {
	const summary: ContactSyncRunSummary = {
		mailboxes: 0,
		skipped: 0,
		notDue: 0,
		folders: 0,
		upserted: 0,
		modified: 0,
		deleted: 0,
		pruned: 0,
		failed: 0,
		aborted: false,
	};

	if (running) {
		logger.warn({ msg: 'Skipping Exchange contact sync run: the previous one is still in progress' });
		return summary;
	}

	running = true;

	try {
		if (!isServerSyncEnabled() || !settings.get<boolean>('Exchange_Contacts_Sync_Enabled')) {
			return summary;
		}

		const provider = getExchangeProvider();

		const defaultRegion = settings.get<string>('Exchange_Contacts_Default_Region') ?? '';

		const intervalDays = Math.max(
			Math.trunc(settings.get<number>('Exchange_Contacts_Sync_Interval_Days')) || MIN_INTERVAL_DAYS,
			MIN_INTERVAL_DAYS,
		);
		const dueSince = new Date(Date.now() - intervalDays * DAY_MS);

		await forEachWithConcurrency(iterateMailboxCandidates(), MAILBOX_CONCURRENCY, async ({ uid, mailbox }) => {
			if (summary.aborted) {
				return;
			}

			// One unmappable user must not end the run.
			if (!mailbox) {
				summary.skipped++;
				return;
			}

			if (await ExchangeContactSyncState.hasFolderSyncedSince(uid, dueSince)) {
				summary.notDue++;
				return;
			}

			summary.mailboxes++;

			const outcome = await syncUserContacts(provider, uid, mailbox, defaultRegion);

			summary.folders += outcome.folders;
			summary.upserted += outcome.upserted;
			summary.modified += outcome.modified;
			summary.deleted += outcome.deleted;
			summary.pruned += outcome.pruned;
			summary.failed += outcome.failed;

			if (outcome.fatal) {
				summary.aborted = true;
			}
		});

		logger.info({ msg: 'Exchange contact sync run finished', ...summary, provider: provider.id });

		return summary;
	} catch (err) {
		if (isExchangeError(err) && err.code === 'not-configured') {
			return summary;
		}

		throw err;
	} finally {
		running = false;
	}
};
