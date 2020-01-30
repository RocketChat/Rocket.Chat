import { Meteor } from 'meteor/meteor';

import { hasPermission, getUsersInRole } from '../../../authorization';

Meteor.publish('livechat:agents', function() {
	console.warn('The publication "livechat:agents" is deprecated and will be removed after version v3.0.0');
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:agents' }));
	}

	if (!hasPermission(this.userId, 'manage-livechat-agents')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:agents' }));
	}

	const self = this;

	const handle = getUsersInRole('livechat-agent').observeChanges({
		added(id, fields) {
			self.added('agentUsers', id, fields);
		},
		changed(id, fields) {
			self.changed('agentUsers', id, fields);
		},
		removed(id) {
			self.removed('agentUsers', id);
		},
	});

	self.ready();

	self.onStop(function() {
		handle.stop();
	});
});
