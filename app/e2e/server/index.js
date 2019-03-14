import { callbacks } from '/app/callbacks';
import { Notifications } from '/app/notifications';

import './settings';
import './methods/setUserPublicAndPivateKeys';
import './methods/getUsersOfRoomWithoutKey';
import './methods/updateGroupKey';
import './methods/setRoomKeyID';
import './methods/fetchMyKeys';
import './methods/resetUserE2EKey';
import './methods/requestSubscriptionKeys';

callbacks.add('afterJoinRoom', (user, room) => {
	Notifications.notifyRoom('e2e.keyRequest', room._id, room.e2eKeyId);
});
