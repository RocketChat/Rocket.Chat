import type { IExchangeSyncLease, IUser } from '@rocket.chat/core-typings';
import { ExchangeSyncLease } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { MongoServerError } from 'mongodb';

import { sleep } from '../../../../../lib/utils/sleep';
import { logger } from '../logger';

/** A lease left behind by an instance that died frees itself after it */
const LEASE_MS = 15 * 60 * 1000;

const LEASE_RENEWAL_MS = LEASE_MS / 5;

const IDLE_POLL_MS = 5000;

const DUPLICATE_KEY = 11000;

export const acquireSyncLease = async (
	scope: IExchangeSyncLease['scope'],
	uid: IUser['_id'],
): Promise<(() => Promise<void>) | undefined> => {
	const token = Random.id();
	const now = new Date();

	try {
		const { upsertedCount, modifiedCount } = await ExchangeSyncLease.acquireLease(
			scope,
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

		logger.warn({ msg: 'Could not take the sync lease, so the mailbox is left for another run', scope, uid, err });
		return undefined;
	}

	const renewal = setInterval(async () => {
		try {
			await ExchangeSyncLease.renewLease(scope, uid, token, new Date(Date.now() + LEASE_MS));
		} catch (err) {
			logger.warn({ msg: 'Could not renew the sync lease', scope, uid, err });
		}
	}, LEASE_RENEWAL_MS);

	return async () => {
		clearInterval(renewal);

		try {
			await ExchangeSyncLease.releaseLease(scope, uid, token);
		} catch (err) {
			logger.warn({ msg: 'Could not release the sync lease; it expires on its own', scope, uid, err });
		}
	};
};

/** Settles once no instance holds a lease of that scope, so a caller about to delete what the syncs write does not race them */
export const whenSyncsIdle = async (scope: IExchangeSyncLease['scope'], keepWaiting: () => boolean): Promise<void> => {
	while (keepWaiting() && (await ExchangeSyncLease.countActiveLeases(scope, new Date())) > 0) {
		await sleep(IDLE_POLL_MS);
	}
};
