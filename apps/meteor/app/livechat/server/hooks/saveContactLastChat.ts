import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';

callbacks.add(
	'livechat.newRoom',
	async (room) => {
		if (!isOmnichannelRoom(room)) {
			return room;
		}

		const {
			_id,
			v: { _id: guestId },
		} = room;

		const lastChat = {
			_id,
			ts: new Date(),
		};
		await LivechatVisitors.setLastChatById(guestId, lastChat);
	},
	callbacks.priority.MEDIUM,
	'livechat-save-last-chat',
);
