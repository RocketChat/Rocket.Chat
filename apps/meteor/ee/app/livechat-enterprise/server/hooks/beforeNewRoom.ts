import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.beforeRoom',
	async (roomInfo, extraData) => {
		if (!extraData) {
			return roomInfo;
		}

		const { sla: searchTerm, customFields } = extraData;
		const roomInfoWithExtraData = { ...roomInfo, ...(!!customFields && { customFields }) };

		if (!searchTerm) {
			return roomInfoWithExtraData;
		}

		const sla = await OmnichannelServiceLevelAgreements.findOneByIdOrName(searchTerm);
		if (!sla) {
			throw new Meteor.Error('error-invalid-sla', 'Invalid sla', {
				function: 'livechat.beforeRoom',
			});
		}

		const { _id: slaId } = sla;
		return { ...roomInfoWithExtraData, slaId };
	},
	callbacks.priority.MEDIUM,
	'livechat-before-new-room',
);
