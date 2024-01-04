import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.beforeRoom',
	async (roomInfo, extraData) => {
		if (!extraData) {
			return roomInfo;
		}

		const { sla: searchTerm } = extraData;
		if (!searchTerm) {
			return roomInfo;
		}

		const sla = await OmnichannelServiceLevelAgreements.findOneByIdOrName(searchTerm);
		if (!sla) {
			throw new Meteor.Error('error-invalid-sla', 'Invalid sla', {
				function: 'livechat.beforeRoom',
			});
		}

		const { _id: slaId } = sla;
		return { ...roomInfo, slaId };
	},
	callbacks.priority.MEDIUM,
	'livechat-before-new-room',
);
