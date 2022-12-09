import { Meteor } from 'meteor/meteor';
import { LivechatPriority, OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { cbLogger } from '../lib/logger';

type Props = {
	sla?: string;
	[other: string]: any;
};

const beforeNewInquiry = async (extraData: Props) => {
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
	const [sla, priority] = await Promise.all([slaP, priorityP]);
	if (!sla && !priority) {
		throw new Meteor.Error('error-invalid-priority', 'Invalid sla or priority', {
			function: 'livechat.beforeInquiry',
		});
	}
	const now = new Date();
	const ts = new Date(now.getTime());
	const changes: {
		ts: Date;
		estimatedWaitingTimeQueue?: number;
		estimatedServiceTimeAt?: Date;
		priorityId?: string;
		priorityWeight?: number;
	} = {
		ts,
	};
	if (sla) {
		changes.estimatedWaitingTimeQueue = sla.dueTimeInMinutes;
		changes.estimatedServiceTimeAt = new Date(now.setMinutes(now.getMinutes() + sla.dueTimeInMinutes));
	}
	if (priority) {
		changes.priorityId = priority._id;
		changes.priorityWeight = priority.sortItem;
	}
	cbLogger.debug('Callback success. Queue timing properties added');
	return { ...props, ...changes };
};

callbacks.add(
	'livechat.beforeInquiry',
	(extraData: Props = {}) => Promise.await(beforeNewInquiry(extraData)),
	callbacks.priority.MEDIUM,
	'livechat-before-new-inquiry',
);
