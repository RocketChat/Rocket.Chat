import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms, Messages } from '../../../models';

export const saveReactWhenReadOnly = function (rid, allowReact, user, sendMessage = true) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveReactWhenReadOnly',
		});
	}

	const result = Rooms.setAllowReactingWhenReadOnlyById(rid, allowReact);

	if (result && sendMessage) {
		allowReact
			? Messages.createRoomAllowedReactingByRoomIdAndUser(rid, user)
			: Messages.createRoomDisallowedReactingByRoomIdAndUser(rid, user);
	}
	return result;
};
