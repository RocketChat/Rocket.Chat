import type { IMessage } from '@rocket.chat/core-typings';

import type { SearchIndexWriter } from './searchIndexWriter';
import { toSearchDoc } from './toSearchDoc';

/** The fields of a `notify-room` `<rid>/deleteMessageBulk` event that the search index uses. */
export type DeleteMessageBulkEvent = {
	rid: string;
	/** The deleted (or changed) messages. Every server path that sends the event today (prune, retention, moderation) sets it. */
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

/**
 * Applies a bulk delete to the local search index. Deleted messages leave the index. When only the files were pruned,
 * a loaded message is indexed again without its file names. A message that is not loaded, or that has no text left,
 * leaves the index until a sync brings it back.
 */
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
