import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { applyDeferredSideEffects } from './applyDeferredSideEffects';
import { resolveMailbox } from './resolveMailboxes';
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

	let changed = false;
	let removedEvents = false;

	try {
		const provider = getExchangeProvider();

		const user = await Users.findOneById<Pick<IUser, '_id' | 'emails'>>(uid, {
			projection: { emails: 1 },
		});

		const mailbox = user && resolveMailbox(user);

		if (!mailbox) {
			// The scheduled run never lands here: its query already requires a verified email, so an
			// unverified user is simply skipped and never asked about.
			if (user) {
				throw new ExchangeError('email-not-verified', 'The user has no verified email address to use as a mailbox');
			}

			throw new ExchangeError('mailbox-not-found', 'No mailbox could be resolved for this user');
		}

		const outcome = await syncMailbox(provider, uid, mailbox, getSyncWindow());

		// Read before the throw below, so a write that committed before the failure still gets its
		// scheduling and its presence refresh from the `finally`.
		changed = outcome.changed;
		removedEvents = outcome.removedEvents;

		if (outcome.failed) {
			throw outcome.error;
		}

		return outcome;
	} finally {
		inFlight.delete(uid);

		const dirty = new Map<IUser['_id'], boolean>(changed ? [[uid, removedEvents]] : []);
		await applyDeferredSideEffects(dirty);
	}
};
