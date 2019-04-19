import { Meteor } from 'meteor/meteor';
import { LivechatExternalMessage } from '../../lib/LivechatExternalMessage';

Meteor.publish('livechat:externalMessages', function(roomId) {
	return LivechatExternalMessage.findByRoomId(roomId);
});
