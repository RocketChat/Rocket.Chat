import { api } from '@rocket.chat/core-services';

import { callbacks } from '../../../lib/callbacks';

import './beforeCreateRoom';
import './methods/setUserPublicAndPrivateKeys';
import './methods/getUsersOfRoomWithoutKey';
import './methods/updateGroupKey';
import './methods/setRoomKeyID';
import './methods/fetchMyKeys';
import './methods/resetOwnE2EKey';
import './methods/requestSubscriptionKeys';

callbacks.add(
	'afterJoinRoom',
	(_user, room) => {
		void api.broadcast('notify.e2e.keyRequest', room._id, room.e2eKeyId);
	},
	callbacks.priority.MEDIUM,
	'e2e',
);
