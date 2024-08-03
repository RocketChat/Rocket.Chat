import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';

callbacks.add(
	'afterSaveMessage',
	async (message, room) => {
		// only call webhook if it is a livechat room
		if (!isOmnichannelRoom(room)) {
			return message;
		}
		return callbacks.run('afterOmnichannelSaveMessage', message, { room });
	},
	callbacks.priority.MEDIUM,
	'after-omnichannel-save-message',
);
