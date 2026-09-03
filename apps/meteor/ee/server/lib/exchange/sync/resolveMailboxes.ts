import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { Filter } from 'mongodb';

import { settings } from '../../../../../server/settings';

const PAGE_SIZE = 500;

type SyncCandidate = Pick<IUser, '_id' | 'emails' | 'customFields'>;

export type MailboxCandidate = { uid: IUser['_id']; mailbox?: string };

export const getMailboxField = (): string => (settings.get<string>('Outlook_Calendar_Server_Sync_Mailbox_Field') || '').trim();

const buildQuery = (mailboxField: string, lastId?: string): Filter<IUser> => ({
	type: { $nin: ['app', 'bot'] },
	federated: { $ne: true },
	isRemote: { $ne: true },
	roles: { $ne: 'guest' },
	// Narrowing here rather than in the loop: otherwise every user in the workspace costs a skip decision.
	...(mailboxField
		? { [`customFields.${mailboxField}`]: { $exists: true, $nin: ['', null] } }
		: { emails: { $elemMatch: { verified: true } } }),
	...(lastId ? { _id: { $gt: lastId } } : {}),
});

export const resolveMailbox = (user: SyncCandidate, mailboxField: string): string | undefined => {
	const raw = mailboxField ? user.customFields?.[mailboxField] : user.emails?.find((email) => email.verified)?.address;

	if (typeof raw !== 'string') {
		return undefined;
	}

	return raw.trim();
};

/**
 * Keyset pages rather than one long cursor: each candidate costs minutes of network I/O behind bounded
 * workers, and a cursor idling that long is closed by the server. Sorting by `_id` keeps this on the
 * `_id` index instead of a deepening skip.
 */
export async function* iterateMailboxCandidates(pageSize = PAGE_SIZE): AsyncGenerator<MailboxCandidate> {
	const mailboxField = getMailboxField();
	let lastId: string | undefined;

	for (;;) {
		const page = await Users.findActive<SyncCandidate>(buildQuery(mailboxField, lastId), {
			projection: { emails: 1, customFields: 1 },
			sort: { _id: 1 },
			limit: pageSize,
		}).toArray();

		if (!page.length) {
			return;
		}

		for (const user of page) {
			yield { uid: user._id, mailbox: resolveMailbox(user, mailboxField) };
		}

		if (page.length < pageSize) {
			return;
		}

		lastId = page[page.length - 1]._id;
	}
}
