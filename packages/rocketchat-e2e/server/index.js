import { RocketChat } from 'meteor/rocketchat:lib';

import './settings';
import './models/Users';
import './models/Rooms';
import './models/Subscriptions';
import './methods/setUserPublicAndPivateKeys';
import './methods/getUsersOfRoomWithoutKey';
import './methods/updateGroupKey';
import './methods/setRoomKeyID';
import './methods/fetchMyKeys';
import './methods/resetUserE2EKey';
import './methods/requestSubscriptionKeys';

RocketChat.callbacks.add('afterJoinRoom', (user, room) => {
	RocketChat.Notifications.notifyRoom('e2e.keyRequest', room._id, room.e2eKeyId);
});
