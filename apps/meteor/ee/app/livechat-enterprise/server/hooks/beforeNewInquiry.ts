import type { ILivechatInquiryRecord, ILivechatPriority, IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';
import { LivechatPriority, OmnichannelServiceLevelAgreements } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.beforeInquiry',
	async (extraData) => {
		const { sla: slaSearchTerm, priority: prioritySearchTerm, ...props } = extraData;
		if (!slaSearchTerm && !prioritySearchTerm) {
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
		const ts = new Date();
		const changes: Partial<ILivechatInquiryRecord> = {
			ts,
		};
		if (sla) {
			changes.slaId = sla._id;
			changes.estimatedWaitingTimeQueue = sla.dueTimeInMinutes;
		}
		if (priority) {
			changes.priorityId = priority._id;
			changes.priorityWeight = priority.sortItem;
		}
		return { ...props, ...changes };
	},
	callbacks.priority.MEDIUM,
	'livechat-before-new-inquiry',
);
