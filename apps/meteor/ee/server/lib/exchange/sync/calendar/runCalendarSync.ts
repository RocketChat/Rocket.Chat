import type { IUser } from '@rocket.chat/core-typings';

import { applyDeferredSideEffects } from './applyDeferredSideEffects';
import { forEachWithConcurrency } from '../forEachWithConcurrency';
import { MAILBOX_CONCURRENCY } from '../limits';
import { iterateMailboxCandidates } from '../resolveMailboxes';
import { syncCalendarWindow } from './syncCalendarWindow';
import { getExchangeProvider, getCalendarSyncWindow, isServerSyncEnabled } from '../../ExchangeProviderRegistry';
import { isExchangeError } from '../../errors';
import { logger } from '../../logger';

export type CalendarSyncRunSummary = {
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

export const runCalendarSync = async (): Promise<CalendarSyncRunSummary> => {
	const summary: CalendarSyncRunSummary = {
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
		logger.warn({ msg: 'Skipping Exchange calendar sync run: the previous one is still in progress' });
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
		const timeWindow = getCalendarSyncWindow();

		await forEachWithConcurrency(iterateMailboxCandidates(), MAILBOX_CONCURRENCY, async ({ uid, mailbox }) => {
			if (summary.aborted) {
				return;
			}

			// One unmappable user must not end the run.
			if (!mailbox) {
				summary.skipped++;
				return;
			}

			summary.mailboxes++;

			const outcome = await syncCalendarWindow(provider, uid, mailbox, timeWindow);

			summary.upserted += outcome.upserted;
			summary.modified += outcome.modified;
			summary.deleted += outcome.deleted;
			summary.pruned += outcome.pruned;

			if (outcome.failed) {
				summary.failed++;
			}

			if (outcome.changed) {
				dirty.set(uid, (dirty.get(uid) ?? false) || outcome.removedEvents);
			}

			if (outcome.fatal) {
				summary.aborted = true;
			}
		});

		logger.info({ msg: 'Exchange calendar sync run finished', ...summary, provider: provider.id });

		return summary;
	} catch (err) {
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
