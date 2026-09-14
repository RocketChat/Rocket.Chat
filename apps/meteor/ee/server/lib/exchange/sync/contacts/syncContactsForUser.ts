import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { resolveMailbox } from '../resolveMailboxes';
import type { UserContactSyncOutcome } from './syncUserContacts';
import { syncUserContacts } from './syncUserContacts';
import { settings } from '../../../../../../server/settings';
import { getExchangeProvider } from '../../ExchangeProviderRegistry';
import { ExchangeError } from '../../errors';

// Separate from the calendar's guard: one on-demand contact sync must not block an on-demand calendar one.
const inFlight = new Set<IUser['_id']>();

/**
 * The on-demand entry point, which resolves for one user what the scheduled run resolves in bulk. Unlike
 * that run it never skips quietly: a user asking for a sync is told why it could not happen.
 */
export const syncContactsForUser = async (uid: IUser['_id']): Promise<UserContactSyncOutcome> => {
	if (inFlight.has(uid)) {
		throw new ExchangeError('rate-limited', 'A contact sync for this mailbox is already in progress');
	}

	inFlight.add(uid);

	try {
		const provider = getExchangeProvider();

		if (!provider.capabilities.supportsContacts) {
			throw new ExchangeError('not-configured', 'The configured Exchange provider cannot read contacts');
		}

		const user = await Users.findOneById<Pick<IUser, '_id' | 'emails'>>(uid, { projection: { emails: 1 } });
		const mailbox = user && resolveMailbox(user);

		if (!mailbox) {
			if (user) {
				throw new ExchangeError('email-not-verified', 'The user has no verified email address to use as a mailbox');
			}

			throw new ExchangeError('mailbox-not-found', 'No mailbox could be resolved for this user');
		}

		return await syncUserContacts(provider, uid, mailbox, settings.get<string>('Exchange_Contacts_Default_Region') ?? '');
	} finally {
		inFlight.delete(uid);
	}
};
