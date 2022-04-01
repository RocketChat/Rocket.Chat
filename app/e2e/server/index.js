import { callbacks } from '../../../lib/callbacks';
import { api } from '../../../server/sdk/api';

import './settings';
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
	(user, room) => {
		api.broadcast('notify.e2e.keyRequest', room._id, room.e2eKeyId);
	},
	callbacks.priority.MEDIUM,
	'e2e',
);
