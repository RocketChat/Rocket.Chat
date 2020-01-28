import { Meteor } from 'meteor/meteor';

import { LivechatExternalMessage } from '../../../models/server';

Meteor.publish('livechat:externalMessages', function(roomId) {
	console.warn('The publication "livechat:externalMessages" is deprecated and will be removed after version v3.0.0');
	return LivechatExternalMessage.findByRoomId(roomId);
});
