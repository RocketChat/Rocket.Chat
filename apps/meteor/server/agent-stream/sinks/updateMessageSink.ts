import type { IMessage } from '@rocket.chat/core-typings';

import { updateMessage } from '../../lib/messages/updateMessage';
import type { SinkFactory } from '../producer';

/** The baseline: every delta rewrites the placeholder with the whole reply so far, through the normal message update. */
export const updateMessageSink: SinkFactory = ({ streamId, user }) => {
	let placeholder: IMessage;

	return {
		start(message) {
			placeholder = message;
		},
		delta(delta, text) {
			return updateMessage(
				{
					_id: placeholder._id,
					rid: placeholder.rid,
					msg: text,
					customFields: placeholder.customFields,
					streaming: { id: streamId, state: 'active', seq: delta.seq, ts: delta.ts },
				} as Parameters<typeof updateMessage>[0],
				user,
			);
		},
		end() {
			// the producer's final write carries the end
		},
	};
};
