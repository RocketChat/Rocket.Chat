import { Rooms } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

export async function saveRoomBroadcast(rid: string, broadcast: boolean) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomReadOnly',
		});
	}

	const result = await Rooms.setBroadcastById(rid, broadcast);

	return result;
}
