import { IRoom, isOmnichannelRoom } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/Livechat';

callbacks.add(
	'livechat.newRoom',
	(room: IRoom) => {
		// do nothing if room is not omnichannel room
		if (!isOmnichannelRoom(room)) {
			return;
		}

		const { _id, v: guestId } = room;

		const lastChat = {
			_id,
			ts: new Date(),
		};
		Livechat.updateLastChat(guestId, lastChat);
	},
	callbacks.priority.MEDIUM,
	'livechat-save-last-chat',
);
