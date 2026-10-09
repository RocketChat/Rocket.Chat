import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { applyDeferredSideEffects } from './applyDeferredSideEffects';
import { acquireMailbox } from '../mailboxLock';
import { resolveMailbox } from '../resolveMailboxes';
import type { CalendarSyncOutcome } from './syncCalendarWindow';
import { syncCalendarWindow } from './syncCalendarWindow';
import { getExchangeProvider, getCalendarSyncWindow } from '../../ExchangeProviderRegistry';
import { ExchangeError } from '../../errors';

export const syncCalendarForUser = async (uid: IUser['_id']): Promise<CalendarSyncOutcome> => {
	const release = acquireMailbox('calendar', uid);

	if (!release) {
		throw new ExchangeError('rate-limited', 'A sync for this mailbox is already in progress');
	}

	let changed = false;

	try {
		const provider = getExchangeProvider();

		const user = await Users.findOneById<Pick<IUser, '_id' | 'emails'>>(uid, {
			projection: { emails: 1 },
		});

		const mailbox = user && resolveMailbox(user);

		if (!mailbox) {
			if (user) {
				throw new ExchangeError('email-not-verified', 'The user has no verified email address to use as a mailbox');
			}

			throw new ExchangeError('mailbox-not-found', 'No mailbox could be resolved for this user');
		}

		const outcome = await syncCalendarWindow(provider, uid, mailbox, getCalendarSyncWindow());

		changed = outcome.changed;

		if (outcome.failed) {
			throw outcome.error;
		}

		return outcome;
	} finally {
		release();

		const dirty = new Set<IUser['_id']>(changed ? [uid] : []);
		await applyDeferredSideEffects(dirty);
	}
};
