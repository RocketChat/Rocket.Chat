import { Meteor } from 'meteor/meteor';
import { LivechatPriority, OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { cbLogger } from '../lib/logger';

callbacks.add(
	'livechat.beforeInquiry',
	(extraData = {}) => {
		const { sla: searchTerm, ...props } = extraData;
		if (!searchTerm) {
			cbLogger.debug('Skipping callback. No search param provided');
			return extraData;
		}

		const slaP = OmnichannelServiceLevelAgreements.findOneByIdOrName(searchTerm, {
			projection: { dueTimeInMinutes: 1 },
		});
		const priorityP = LivechatPriority.findOneByIdOrName(searchTerm, {
			projection: { _id: 1, priorityWeight: 1 },
		});
		const [sla, priority] = Promise.await([slaP, priorityP]);
		if (!sla && !priority) {
			throw new Meteor.Error('error-invalid-priority', 'Invalid sla or priority', {
				function: 'livechat.beforeInquiry',
			});
		}
		if (sla && priority) {
			throw new Meteor.Error('error-invalid-state', 'You cannot have both sla and priority assigned to the same inquiry at a time', {
				function: 'livechat.beforeInquiry',
			});
		}
		const now = new Date();
		const ts = new Date(now.getTime());
		const changes = {
			ts,
		};
		if (sla) {
			changes.estimatedWaitingTimeQueue = sla.dueTimeInMinutes;
			changes.estimatedServiceTimeAt = new Date(now.setMinutes(now.getMinutes() + sla.dueTimeInMinutes));
		}
		if (priority) {
			changes.priorityId = priority._id;
			changes.priorityWeight = priority.priorityWeight;
		}
		cbLogger.debug('Callback success. Queue timing properties added');
		return { ...props, ...changes };
	},
	callbacks.priority.MEDIUM,
	'livechat-before-new-inquiry',
);
