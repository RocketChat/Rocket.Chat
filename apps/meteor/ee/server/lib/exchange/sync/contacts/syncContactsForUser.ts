import { ExchangeError, acquireSyncLease, getExchangeProvider, resolveMailbox } from '@rocket.chat/exchange';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import type { UserContactSyncOutcome } from './syncUserContacts';
import { syncUserContacts } from './syncUserContacts';
import { settings } from '../../../../../../server/settings';

export const syncContactsForUser = async (uid: IUser['_id']): Promise<UserContactSyncOutcome> => {
	const provider = getExchangeProvider();

	const user = await Users.findOneById<Pick<IUser, '_id' | 'emails'>>(uid, { projection: { emails: 1 } });
	const mailbox = user && resolveMailbox(user);

	if (!mailbox) {
		if (user) {
			throw new ExchangeError('email-not-verified', 'The user has no verified email address to use as a mailbox');
		}

		throw new ExchangeError('mailbox-not-found', 'No mailbox could be resolved for this user');
	}

	const release = await acquireSyncLease('contacts', uid);

	if (!release) {
		throw new ExchangeError('sync-in-progress', 'A contact sync for this mailbox is already in progress');
	}

	try {
		const outcome = await syncUserContacts(provider, uid, mailbox, settings.get<string>('Exchange_Contacts_Default_Region') ?? '');

		if (outcome.failed) {
			throw outcome.error;
		}

		return outcome;
	} finally {
		await release();
	}
};
