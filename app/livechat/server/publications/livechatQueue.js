import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatDepartmentAgents } from '../../../models';

Meteor.publish('livechat:queue', function() {
	console.warn('The publication "livechat:queue" is deprecated and will be removed after version v3.0.0');
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:queue' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:queue' }));
	}
	const self = this;

	const handleDepts = LivechatDepartmentAgents.findUsersInQueue().observeChanges({
		added(id, fields) {
			self.added('livechatQueueUser', id, fields);
		},
		changed(id, fields) {
			self.changed('livechatQueueUser', id, fields);
		},
		removed(id) {
			self.removed('livechatQueueUser', id);
		},
	});

	this.ready();

	this.onStop(() => {
		handleDepts.stop();
	});
});
