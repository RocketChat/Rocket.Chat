import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { applyDeferredSideEffects } from './applyDeferredSideEffects';
import { getMailboxField, resolveMailbox } from './resolveMailboxes';
import type { MailboxSyncOutcome } from './syncMailbox';
import { syncMailbox } from './syncMailbox';
import { getExchangeProvider, getSyncWindow } from '../ExchangeProviderRegistry';
import { ExchangeError } from '../errors';

const inFlight = new Set<IUser['_id']>();

export const syncUserMailbox = async (uid: IUser['_id']): Promise<MailboxSyncOutcome> => {
	if (inFlight.has(uid)) {
		throw new ExchangeError('rate-limited', 'A sync for this mailbox is already in progress');
	}

	inFlight.add(uid);

	const dirty = new Map<IUser['_id'], boolean>();

	try {
		const provider = getExchangeProvider();

		const user = await Users.findOneById<Pick<IUser, '_id' | 'emails' | 'customFields'>>(uid, {
			projection: { emails: 1, customFields: 1 },
		});

		const mailboxField = getMailboxField();
		const mailbox = user && resolveMailbox(user, mailboxField);

		if (!mailbox) {
			// Without a custom field the mailbox is the verified address, so an unverified one is the caller's
			// own fix rather than an admin's. The scheduled run never lands here: its query already requires a
			// verified email, so an unverified user is simply skipped and never asked about.
			if (user && !mailboxField && !user.emails?.some(({ verified }) => verified)) {
				throw new ExchangeError('email-not-verified', 'The user has no verified email address to use as a mailbox');
			}

			throw new ExchangeError('mailbox-not-found', 'No mailbox could be resolved for this user');
		}

		const outcome = await syncMailbox(provider, uid, mailbox, getSyncWindow());

		if (outcome.changed) {
			dirty.set(uid, outcome.removedEvents);
		}

		return outcome;
	} finally {
		inFlight.delete(uid);
		await applyDeferredSideEffects(dirty);
	}
};
