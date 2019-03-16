import { callbacks } from '../../callbacks';
import { Notifications } from '../../notifications';

import './settings';
import './methods/fetchMyKeys';
import './methods/fetchSavedState';
import './methods/getUsersOfRoomWithoutKey';
import './methods/requestSubscriptionKeys';
import './methods/resetUserE2EKey';
import './methods/setRoomKeyID';
import './methods/setUserPublicAndPivateKeys';
import './methods/updateGroupKey';
import './methods/updateSavedKeyUser';

callbacks.add('afterJoinRoom', (user, room) => {
	Notifications.notifyRoom('e2e.keyRequest', room._id, room.e2eKeyId);
});
