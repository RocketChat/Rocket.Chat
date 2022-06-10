import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/Livechat';

callbacks.add(
	'livechat.newRoom',
	(room) => {
		const {
			_id,
			v: { _id: guestId },
		} = room;

		const lastChat = {
			_id,
			ts: new Date(),
		};
		Livechat.updateLastChat(guestId, lastChat);
	},
	callbacks.priority.MEDIUM,
	'livechat-save-last-chat',
);
