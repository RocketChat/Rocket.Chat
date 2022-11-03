import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../lib/callbacks';
import LivechatPriority from '../../../models/server/models/LivechatPriority';

callbacks.add(
	'livechat.beforeRoom',
	(roomInfo, extraData) => {
		if (!extraData) {
			return roomInfo;
		}

		const { priority: searchTerm } = extraData;
		if (!searchTerm) {
			return roomInfo;
		}

		const priority = LivechatPriority.findOneByIdOrName(searchTerm);
		if (!priority) {
			throw new Meteor.Error('error-invalid-priority', 'Invalid priority', {
				function: 'livechat.beforeRoom',
			});
		}

		const { _id: priorityId } = priority;
		return Object.assign({ ...roomInfo }, { priorityId });
	},
	callbacks.priority.MEDIUM,
	'livechat-before-new-room',
);
