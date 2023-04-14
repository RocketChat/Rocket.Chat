import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/Livechat';

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
		await Livechat.updateLastChat(guestId, lastChat);
	},
	callbacks.priority.MEDIUM,
	'livechat-save-last-chat',
);
