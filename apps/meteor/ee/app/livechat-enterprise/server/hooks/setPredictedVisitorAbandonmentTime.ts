import type { IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage, isMessageFromVisitor } from '@rocket.chat/core-typings';
import moment from 'moment';

import { markRoomResponded } from '../../../../../app/livechat/server/hooks/markRoomResponded';
import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { setPredictedVisitorAbandonmentTime } from '../lib/Helper';

function shouldSaveInactivity(message: IMessage): boolean {
	if (message.t || isEditedMessage(message) || isMessageFromVisitor(message)) {
		return false;
	}

	const abandonedRoomsAction = settings.get('Livechat_abandoned_rooms_action');
	const visitorInactivityTimeout = settings.get<number>('Livechat_visitor_inactivity_timeout');

	if (!abandonedRoomsAction || abandonedRoomsAction === 'none' || visitorInactivityTimeout <= 0) {
		return false;
	}

	return true;
}

callbacks.remove('afterOmnichannelSaveMessage', 'markRoomResponded');

callbacks.add(
	'afterOmnichannelSaveMessage',
	async (message, { room, roomUpdater }) => {
		const responseBy = await markRoomResponded(message, room, roomUpdater);

		if (!shouldSaveInactivity(message)) {
			return message;
		}

		if (!responseBy) {
			return;
		}

		if (moment(responseBy.firstResponseTs).isSame(moment(message.ts))) {
			await setPredictedVisitorAbandonmentTime({ ...room, responseBy }, roomUpdater);
		}
	},
	callbacks.priority.MEDIUM,
	'save-visitor-inactivity',
);
