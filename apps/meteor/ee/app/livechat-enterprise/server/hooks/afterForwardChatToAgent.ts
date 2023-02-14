import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.afterForwardChatToAgent',
	(options: { rid?: string } = {}) => {
		const { rid } = options;
		if (!rid) {
			return options;
		}

		Promise.await(LivechatRooms.unsetPredictedVisitorAbandonmentByRoomId(rid));

		return options;
	},
	callbacks.priority.MEDIUM,
	'livechat-after-forward-room-to-department',
);
