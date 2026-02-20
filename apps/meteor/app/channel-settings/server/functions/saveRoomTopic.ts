import { Message, Room } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../server/lib/callbacks';

export const saveRoomTopic = async (
	rid: string,
	roomTopic: string | undefined,
	user: Pick<IUser, 'username' | '_id' | 'federation' | 'federated'>,
	sendMessage = true,
) => {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomTopic',
		});
	}

	const room = await Rooms.findOneById(rid);

	await Room.beforeTopicChange(room!);

	const update = await Rooms.setTopicById(rid, roomTopic);
	if (update && sendMessage) {
		await Message.saveSystemMessage('room_changed_topic', rid, roomTopic || '', user);
	}
	await callbacks.run('afterRoomTopicChange', undefined, { room, topic: roomTopic, user });
	return update;
};
