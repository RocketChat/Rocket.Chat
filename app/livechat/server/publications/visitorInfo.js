import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatRooms, LivechatVisitors } from '../../../models';

console.warn('The publication "livechat:visitorInfo" is deprecated and will be removed after version v3.0.0');
Meteor.publish('livechat:visitorInfo', function({ rid: roomId }) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorInfo' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorInfo' }));
	}

	const room = LivechatRooms.findOneById(roomId);

	if (room && room.v && room.v._id) {
		return LivechatVisitors.findById(room.v._id);
	}
	return this.ready();
});
