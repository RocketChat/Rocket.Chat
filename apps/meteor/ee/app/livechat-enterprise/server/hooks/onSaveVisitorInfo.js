import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

callbacks.add(
	'livechat.saveInfo',
	(room, { user, oldRoom }) => {
		if (!room || !user) {
			return room;
		}

		const { slaId: oldSlaId = null } = oldRoom;
		const { slaId: newSlaId = null } = room;
		if (oldSlaId === newSlaId) {
			return room;
		}

		const priority = newSlaId && Promise.await(OmnichannelServiceLevelAgreements.findOneById(newSlaId));
		LivechatEnterprise.updateRoomSLA(room._id, user, priority);

		return room;
	},
	callbacks.priority.HIGH,
	'livechat-on-save-visitor-info',
);
