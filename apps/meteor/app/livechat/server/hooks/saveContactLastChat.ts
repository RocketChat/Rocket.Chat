import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatContacts, LivechatVisitors } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';

callbacks.add(
	'livechat.newRoom',
	async (room) => {
		if (!isOmnichannelRoom(room)) {
			return room;
		}

		const {
			_id,
			v: { _id: guestId, contactId },
		} = room;

		const lastChat = {
			_id,
			ts: new Date(),
		};
		await LivechatVisitors.setLastChatById(guestId, lastChat);
		if (contactId) {
			await LivechatContacts.updateLastChatById(contactId, lastChat);
		}
	},
	callbacks.priority.MEDIUM,
	'livechat-save-last-chat',
);
