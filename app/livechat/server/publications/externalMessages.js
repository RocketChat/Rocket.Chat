import { Meteor } from 'meteor/meteor';

import { LivechatExternalMessage } from '../../../models/server';

console.warn('The publication "livechat:externalMessages" is deprecated and will be removed after version v3.0.0');
Meteor.publish('livechat:externalMessages', function(roomId) {
	return LivechatExternalMessage.findByRoomId(roomId);
});
