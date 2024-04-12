import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isEditedMessage, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';
import moment from 'moment';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { setPredictedVisitorAbandonmentTime } from '../lib/Helper';

callbacks.add(
	'afterSaveMessage',
	async (message, room) => {
		if (!isOmnichannelRoom(room)) {
			return message;
		}

		if (
			!settings.get('Livechat_abandoned_rooms_action') ||
			settings.get('Livechat_abandoned_rooms_action') === 'none' ||
			settings.get<number>('Livechat_visitor_inactivity_timeout') <= 0
		) {
			return message;
		}
		// skips this callback if the message was edited
		if (isEditedMessage(message)) {
			return message;
		}
		// if the message has a type means it is a special message (like the closing comment), so skip it
		if (message.t) {
			return message;
		}
		// message from visitor
		if (message.token) {
			return message;
		}

		const latestRoom = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, '_id' | 'responseBy' | 'departmentId'>>(room._id, {
			projection: {
				_id: 1,
				responseBy: 1,
				departmentId: 1,
			},
		});

		if (!latestRoom?.responseBy) {
			return message;
		}

		if (moment(latestRoom.responseBy.firstResponseTs).isSame(moment(message.ts))) {
			await setPredictedVisitorAbandonmentTime(latestRoom);
		}

		return message;
	},
	callbacks.priority.MEDIUM,
	'save-visitor-inactivity',
); // This hook priority should always be less than the priority of hook "markRoomResponded" bcs, the room.responseBy.firstMessage property set there is being used here for determining visitor abandonment
