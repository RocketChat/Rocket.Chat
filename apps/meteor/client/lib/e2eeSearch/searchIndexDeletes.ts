import type { IMessage } from '@rocket.chat/core-typings';

import type { SearchIndexWriter } from './searchIndexWriter';
import { toSearchDoc } from './toSearchDoc';

export type DeleteMessageBulkEvent = {
	rid: string;
	ids?: string[];
	filesOnly?: boolean;
	showDeletedStatus?: boolean;
};

type Dependencies = {
	writer: Pick<SearchIndexWriter, 'index' | 'remove'>;
	findMessage: (id: string) => IMessage | undefined;
};

/** Remove deleted content while allowing later synchronization of unloaded file-only edits. */
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
	if (notLoaded.length) await writer.remove(notLoaded, { deleted: false });
};
