import type { IUser } from '@rocket.chat/core-typings';

import { applyDeferredSideEffects } from './applyDeferredSideEffects';
import { forEachWithConcurrency } from './forEachWithConcurrency';
import { getMailboxField, iterateMailboxCandidates } from './resolveMailboxes';
import { syncMailbox } from './syncMailbox';
import { getExchangeProvider, getSyncWindow, isServerSyncEnabled } from '../ExchangeProviderRegistry';
import { isExchangeError } from '../errors';
import { logger } from '../logger';

// How many mailboxes at once. Kept low because neither server tells us its request limit, and crossing it
// gets us throttled. Raising it does not speed up EWS: that transport talks to Exchange one call at a time.
const MAILBOX_CONCURRENCY = 5;

export type ExchangeSyncRunSummary = {
	mailboxes: number;
	skipped: number;
	upserted: number;
	modified: number;
	deleted: number;
	pruned: number;
	failed: number;
	aborted: boolean;
};

let running = false;

export const runExchangeSync = async (): Promise<ExchangeSyncRunSummary> => {
	const summary: ExchangeSyncRunSummary = {
		mailboxes: 0,
		skipped: 0,
		upserted: 0,
		modified: 0,
		deleted: 0,
		pruned: 0,
		failed: 0,
		aborted: false,
	};

	if (running) {
		logger.warn({ msg: 'Skipping Exchange sync run: the previous one is still in progress' });
		return summary;
	}

	running = true;

	// The value is the delete gate: true only when this user had a busy, in-progress event removed.
	const dirty = new Map<IUser['_id'], boolean>();

	try {
		if (!isServerSyncEnabled()) {
			return summary;
		}

		const provider = getExchangeProvider();
		const window = getSyncWindow();

		await forEachWithConcurrency(iterateMailboxCandidates(), MAILBOX_CONCURRENCY, async ({ uid, mailbox }) => {
			if (summary.aborted) {
				return;
			}

			// A user we cannot map is counted and left alone: one unmappable user must not end the run.
			if (!mailbox) {
				summary.skipped++;
				return;
			}

			summary.mailboxes++;

			const outcome = await syncMailbox(provider, uid, mailbox, window);

			summary.upserted += outcome.upserted;
			summary.modified += outcome.modified;
			summary.deleted += outcome.deleted;
			summary.pruned += outcome.pruned;

			if (outcome.failed) {
				summary.failed++;
			}

			if (outcome.changed) {
				dirty.set(uid, (dirty.get(uid) ?? false) || outcome.endedInProgressEvent);
			}

			if (outcome.fatal) {
				summary.aborted = true;
			}
		});

		const mailboxField = getMailboxField();
		if (mailboxField && summary.mailboxes === 0 && summary.skipped > 0) {
			logger.warn({ msg: 'No user has a usable mailbox in the configured custom field', mailboxField });
		}

		logger.info({ msg: 'Exchange sync run finished', ...summary, provider: provider.id });

		return summary;
	} catch (err) {
		// The provider was torn down between the tick and here. Nothing to sync, not a failure.
		if (isExchangeError(err) && err.code === 'not-configured') {
			return summary;
		}

		throw err;
	} finally {
		running = false;

		// Has to run after a throw too, or the schedulers stay armed for an answer the collection no longer holds.
		await applyDeferredSideEffects(dirty);
	}
};
