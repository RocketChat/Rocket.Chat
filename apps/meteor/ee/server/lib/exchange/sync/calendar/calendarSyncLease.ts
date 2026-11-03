import type { IUser } from '@rocket.chat/core-typings';
import { ExchangeCalendarSyncState } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { MongoServerError } from 'mongodb';

import { sleep } from '../../../../../../lib/utils/sleep';
import { logger } from '../../logger';
import { scrubForLog } from '../../scrub';

/** A lease left behind by an instance that died frees itself after it */
const LEASE_MS = 15 * 60 * 1000;

const LEASE_RENEWAL_MS = LEASE_MS / 5;

const IDLE_POLL_MS = 5000;

const DUPLICATE_KEY = 11000;

export const acquireCalendarSyncLease = async (uid: IUser['_id']): Promise<(() => Promise<void>) | undefined> => {
	const token = Random.id();
	const now = new Date();

	try {
		const { upsertedCount, modifiedCount } = await ExchangeCalendarSyncState.acquireSyncLease(
			uid,
			token,
			new Date(now.getTime() + LEASE_MS),
			now,
		);

		if (!upsertedCount && !modifiedCount) {
			return undefined;
		}
	} catch (err) {
		if (err instanceof MongoServerError && err.code === DUPLICATE_KEY) {
			return undefined;
		}

		logger.warn({ msg: 'Could not take the calendar sync lease, so the mailbox is left for another run', uid, err: scrubForLog(err) });
		return undefined;
	}

	const renewal = setInterval(async () => {
		try {
			await ExchangeCalendarSyncState.renewSyncLease(uid, token, new Date(Date.now() + LEASE_MS));
		} catch (err) {
			logger.warn({ msg: 'Could not renew the calendar sync lease', uid, err: scrubForLog(err) });
		}
	}, LEASE_RENEWAL_MS);

	return async () => {
		clearInterval(renewal);

		try {
			await ExchangeCalendarSyncState.releaseSyncLease(uid, token);
		} catch (err) {
			logger.warn({ msg: 'Could not release the calendar sync lease; it expires on its own', uid, err: scrubForLog(err) });
		}
	};
};

/** Settles once no instance holds a calendar sync lease, so a caller about to delete what the syncs write does not race them */
export const whenCalendarSyncsIdle = async (keepWaiting: () => boolean): Promise<void> => {
	while (keepWaiting() && (await ExchangeCalendarSyncState.countActiveSyncLeases(new Date())) > 0) {
		await sleep(IDLE_POLL_MS);
	}
};
