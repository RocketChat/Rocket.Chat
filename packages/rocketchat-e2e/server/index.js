import { RocketChat } from 'meteor/rocketchat:lib';

import './settings';
import './models/Users';
import './models/Rooms';
import './models/Subscriptions';
import './methods/addKeyToChain';
import './methods/getUsersOfRoomWithoutKey';
import './methods/fetchKeychain';
import './methods/updateGroupE2EKey';
import './methods/setRoomKeyID';
import './methods/fetchMyKeys';

RocketChat.callbacks.add('afterJoinRoom', (user, room) => {
	RocketChat.Notifications.notifyRoom('e2e.keyRequest', room._id, room.e2eKeyId);
});
