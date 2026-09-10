import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { Filter } from 'mongodb';

const PAGE_SIZE = 500;

type SyncCandidate = Pick<IUser, '_id' | 'emails'>;

type MailboxCandidate = { uid: IUser['_id']; mailbox?: string };

const buildQuery = (lastId?: string): Filter<IUser> => ({
	type: { $nin: ['app', 'bot'] },
	federated: { $ne: true },
	isRemote: { $ne: true },
	roles: { $ne: 'guest' },
	emails: { $elemMatch: { verified: true } },
	...(lastId ? { _id: { $gt: lastId } } : {}),
});

export const resolveMailbox = (user: SyncCandidate): string | undefined => user.emails?.find((email) => email.verified)?.address.trim();

/**
 * Keyset pages rather than one long cursor: each candidate costs minutes of network I/O behind bounded
 * workers, and a cursor idling that long is closed by the server. Sorting by `_id` keeps this on the
 * `_id` index instead of a deepening skip.
 */
export async function* iterateMailboxCandidates(pageSize = PAGE_SIZE): AsyncGenerator<MailboxCandidate> {
	let lastId: string | undefined;

	for (;;) {
		const page = await Users.findActive<SyncCandidate>(buildQuery(lastId), {
			projection: { emails: 1 },
			sort: { _id: 1 },
			limit: pageSize,
		}).toArray();

		if (!page.length) {
			return;
		}

		for (const user of page) {
			yield { uid: user._id, mailbox: resolveMailbox(user) };
		}

		if (page.length < pageSize) {
			return;
		}

		lastId = page[page.length - 1]._id;
	}
}
