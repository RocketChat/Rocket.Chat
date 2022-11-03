import { Meteor } from 'meteor/meteor';
import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.beforeRoom',
	(roomInfo, extraData) => {
		if (!extraData) {
			return roomInfo;
		}

		const { sla: searchTerm } = extraData;
		if (!searchTerm) {
			return roomInfo;
		}

		const sla = Promise.await(OmnichannelServiceLevelAgreements.findOneByIdOrName(searchTerm));
		if (!sla) {
			throw new Meteor.Error('error-invalid-priority', 'Invalid sla', {
				function: 'livechat.beforeRoom',
			});
		}

		const { _id: slaId } = sla;
		return Object.assign({ ...roomInfo }, { slaId });
	},
	callbacks.priority.MEDIUM,
	'livechat-before-new-room',
);
