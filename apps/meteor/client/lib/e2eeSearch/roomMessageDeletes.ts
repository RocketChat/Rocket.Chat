import { Emitter } from '@rocket.chat/emitter';

import type { DeleteMessageBulkEvent } from './searchIndexDeletes';

/** The deletes that the room streams applied, published so the room manager does not import the E2EE client. */
export const roomMessageDeletes = new Emitter<{
	deleteMessage: { _id: string; rid: string };
	deleteMessageBulk: DeleteMessageBulkEvent;
}>();
