import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../app/callbacks';
import LivechatPriority from '../../../models/server/models/LivechatPriority';

callbacks.add('livechat.beforeInquiry', (extraData = {}) => {
	const { priority: searchTerm, ...props } = extraData;
	if (!searchTerm) {
		return extraData;
	}

	const priority = LivechatPriority.findOneByIdOrName(searchTerm, { fields: { dueTimeInMinutes: 1 } });
	if (!priority) {
		throw new Meteor.Error('error-invalid-priority', 'Invalid priority', { function: 'livechat.beforeInquiry' });
	}

	const now = new Date();
	const ts = new Date(now.getTime());
	const { dueTimeInMinutes: estimatedWaitingTimeQueue } = priority;
	const queueOrder = 0;
	const estimatedServiceTimeAt = new Date(now.setMinutes(now.getMinutes() + estimatedWaitingTimeQueue));

	return Object.assign({ ...props }, { ts, queueOrder, estimatedWaitingTimeQueue, estimatedServiceTimeAt });
}, callbacks.priority.MEDIUM, 'livechat-before-new-inquiry');
