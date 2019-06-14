import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatSessions } from '../../../models';

Meteor.publish('livechat:location', function() {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:location' }));
	}

	if (!hasPermission(this.userId, 'view-livechat-manager')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:location' }));
	}

	const self = this;

	const handle = LivechatSessions.find().observeChanges({
		added(id, fields) {
			self.added('livechatLocation', id, fields);
		},
		changed(id, fields) {
			self.changed('livechatLocation', id, fields);
		},
		removed(id) {
			self.removed('livechatLocation', id);
		},
	});

	self.ready();

	self.onStop(function() {
		handle.stop();
	});
});
