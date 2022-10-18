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
		const { slaId: newslaId = null } = room;
		if (oldSlaId === newslaId) {
			return room;
		}

		const priority = newslaId && Promise.await(OmnichannelServiceLevelAgreements.findOneById(newslaId));
		LivechatEnterprise.updateRoomPriority(room._id, user, priority);

		return room;
	},
	callbacks.priority.HIGH,
	'livechat-on-save-visitor-info',
);
