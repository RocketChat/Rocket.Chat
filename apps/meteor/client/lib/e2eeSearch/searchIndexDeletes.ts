import type { IMessage } from '@rocket.chat/core-typings';

import type { SearchIndexWriter } from './searchIndexWriter';
import { toSearchDoc } from './toSearchDoc';

/** The fields of a `notify-room` `<rid>/deleteMessageBulk` event that the search index uses. */
export type DeleteMessageBulkEvent = {
	rid: string;
	/** The deleted (or changed) messages. */
	ids?: string[];
	/** Only the files of the messages were removed. The messages stay. */
	filesOnly?: boolean;
	/** The messages stay as "message deleted" placeholders (moderation). */
	showDeletedStatus?: boolean;
};

type Dependencies = {
	writer: Pick<SearchIndexWriter, 'index' | 'remove'>;
	/** The decrypted message from the client's message store, after the event changed it. */
	findMessage: (id: string) => IMessage | undefined;
};

/** Applies a bulk delete to the local search index. A message that kept its text but lost its files is indexed again. */
export const applyDeleteMessageBulkToSearchIndex = async (
	{ ids = [], filesOnly }: DeleteMessageBulkEvent,
	{ writer, findMessage }: Dependencies,
): Promise<void> => {
	if (ids.length === 0) return;

	if (!filesOnly) {
		await writer.remove(ids);
		return;
	}

	const notLoaded: string[] = [];
	for (const id of ids) {
		const message = findMessage(id);
		if (message && toSearchDoc(message)) {
			writer.index(message);
		} else {
			notLoaded.push(id);
		}
	}

	if (notLoaded.length) {
		await writer.remove(notLoaded, { deleted: false });
	}
};
