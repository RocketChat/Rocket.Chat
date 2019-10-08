import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatRooms } from '../../../models';
import { canAccessRoom } from '../../../authorization/server/functions/canAccessRoom';

const userCanAccessRoom = (rid) => {
	if (!rid) {
		return;
	}

	const room = LivechatRooms.findOneById(rid);
	const user = Meteor.user();

	return canAccessRoom(room, user);
};

Meteor.publish('livechat:roomInfo', function(rid) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:roomInfo' }));
	}

	if (!hasPermission(this.userId, 'view-l-room') || !userCanAccessRoom(rid)) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:roomInfo' }));
	}

	const self = this;

	const handle = LivechatRooms.findById(rid).observeChanges({
		added(id, fields) {
			self.added('livechatRoomInfo', id, fields);
		},
		changed(id, fields) {
			self.changed('livechatRoomInfo', id, fields);
		},
		removed(id) {
			self.removed('livechatRoomInfo', id);
		},
	});

	self.ready();

	self.onStop(function() {
		handle.stop();
	});
});
