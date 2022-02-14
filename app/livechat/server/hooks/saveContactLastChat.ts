import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/Livechat';

type RoomData = { _id: string; v: string };

callbacks.add(
	'livechat.newRoom',
	(room: RoomData) => {
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
