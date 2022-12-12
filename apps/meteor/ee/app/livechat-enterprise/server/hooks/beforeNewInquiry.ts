import { Meteor } from 'meteor/meteor';
import { LivechatPriority, OmnichannelServiceLevelAgreements } from '@rocket.chat/models';
import type { ILivechatPriority, IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../lib/callbacks';
import { cbLogger } from '../lib/logger';

type Props = {
	sla?: string;
	priority?: string;
	[other: string]: any;
};

const beforeNewInquiry = async (extraData: Props) => {
	const { sla: slaSearchTerm, priority: prioritySearchTerm, ...props } = extraData;
	if (!slaSearchTerm && !prioritySearchTerm) {
		cbLogger.debug('Skipping callback. No sla or priority provided');
		return extraData;
	}

	let sla: IOmnichannelServiceLevelAgreements | null = null;
	let priority: ILivechatPriority | null = null;

	if (slaSearchTerm) {
		sla = await OmnichannelServiceLevelAgreements.findOneByIdOrName(slaSearchTerm, {
			projection: { dueTimeInMinutes: 1 },
		});
		if (!sla) {
			throw new Meteor.Error('error-invalid-sla', 'Invalid sla', {
				function: 'livechat.beforeInquiry',
			});
		}
	}
	if (prioritySearchTerm) {
		priority = await LivechatPriority.findOneByIdOrName(prioritySearchTerm, {
			projection: { _id: 1, sortItem: 1 },
		});
		if (!priority) {
			throw new Meteor.Error('error-invalid-priority', 'Invalid priority', {
				function: 'livechat.beforeInquiry',
			});
		}
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
	cbLogger.debug('Callback success. Queue timing properties added to inquiry', changes);
	return { ...props, ...changes };
};

callbacks.add(
	'livechat.beforeInquiry',
	(extraData: Props = {}) => Promise.await(beforeNewInquiry(extraData)),
	callbacks.priority.MEDIUM,
	'livechat-before-new-inquiry',
);
