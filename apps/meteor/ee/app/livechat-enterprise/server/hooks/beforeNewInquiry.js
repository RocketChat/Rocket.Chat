import { Meteor } from 'meteor/meteor';
import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

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

		const sla = Promise.await(
			OmnichannelServiceLevelAgreements.findOneByIdOrName(searchTerm, {
				projection: { dueTimeInMinutes: 1 },
			}),
		);
		if (!sla) {
			throw new Meteor.Error('error-invalid-priority', 'Invalid sla', {
				function: 'livechat.beforeInquiry',
			});
		}

		const now = new Date();
		const ts = new Date(now.getTime());
		const { dueTimeInMinutes: estimatedWaitingTimeQueue } = sla;
		const estimatedServiceTimeAt = new Date(now.setMinutes(now.getMinutes() + estimatedWaitingTimeQueue));

		cbLogger.debug('Callback success. Queue timing properties added');
		return Object.assign({ ...props }, { ts, estimatedWaitingTimeQueue, estimatedServiceTimeAt });
	},
	callbacks.priority.MEDIUM,
	'livechat-before-new-inquiry',
);
