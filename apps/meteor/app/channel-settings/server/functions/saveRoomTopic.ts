import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Messages, Rooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';

export const saveRoomTopic = async function (
	rid: string,
	roomTopic: string | undefined,
	user: {
		username: string;
		_id: string;
	},
	sendMessage = true,
) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomTopic',
		});
	}

	const update = await Rooms.setTopicById(rid, roomTopic);
	if (update && sendMessage) {
		await Messages.createWithTypeRoomIdMessageUserAndUnread(
			'room_changed_topic',
			rid,
			roomTopic || '',
			user,
			settings.get('Message_Read_Receipt_Enabled'),
		);
	}
	callbacks.run('afterRoomTopicChange', { rid, topic: roomTopic });
	return update;
};
