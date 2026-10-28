import { Message, ClientSafeError } from '@rocket.chat/core-services';
import { Rooms } from '@rocket.chat/models';
import { Match } from 'meteor/check';

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
		throw new ClientSafeError('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveReactWhenReadOnly',
		});
	}

	const result = await Rooms.setAllowReactingWhenReadOnlyById(rid, allowReact);

	if (result && sendMessage) {
		const type = allowReact ? 'room-allowed-reacting' : 'room-disallowed-reacting';

		await Message.saveSystemMessage(type, rid, '', user);
	}
};
