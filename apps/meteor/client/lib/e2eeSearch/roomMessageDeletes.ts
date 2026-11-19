import { Emitter } from '@rocket.chat/emitter';

import type { DeleteMessageBulkEvent } from './searchIndexDeletes';

/**
 * The room streams publish deletes here after they change the message store. The local search index listens, so the
 * room manager does not import the E2EE client.
 */
export const roomMessageDeletes = new Emitter<{
	deleteMessage: { _id: string };
	deleteMessageBulk: DeleteMessageBulkEvent;
}>();
