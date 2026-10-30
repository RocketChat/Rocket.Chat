import { Emitter } from '@rocket.chat/emitter';

import type { DeleteMessageBulkEvent } from './searchIndexDeletes';

/** Publish deletions after the message store changes. */
export const roomMessageDeletes = new Emitter<{
	deleteMessage: { _id: string };
	deleteMessageBulk: DeleteMessageBulkEvent;
}>();
