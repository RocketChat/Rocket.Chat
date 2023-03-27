import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Rooms } from '@rocket.chat/models';

import { Messages } from '../../../models/server';

export const saveReactWhenReadOnly = async function (
	rid: string,
	allowReact: boolean,
	user: {
		_id: string;
		username: string;
	},
	sendMessage = true,
) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveReactWhenReadOnly',
		});
	}

	const result = await Rooms.setAllowReactingWhenReadOnlyById(rid, allowReact);

	if (result && sendMessage) {
		allowReact
			? Messages.createRoomAllowedReactingByRoomIdAndUser(rid, user)
			: Messages.createRoomDisallowedReactingByRoomIdAndUser(rid, user);
	}
	return result;
};
