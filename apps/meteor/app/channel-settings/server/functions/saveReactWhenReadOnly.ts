import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Messages, Rooms } from '@rocket.chat/models';

import { settings } from '../../../settings/server';

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
		const type = allowReact ? 'room-allowed-reacting' : 'room-disallowed-reacting';
		await Messages.createWithTypeRoomIdMessageUserAndUnread(type, rid, '', user, settings.get('ReadReceipt_Enabled'));
	}
	return result;
};
