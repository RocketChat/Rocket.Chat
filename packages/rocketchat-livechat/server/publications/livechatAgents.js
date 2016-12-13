Meteor.publish('livechat:agents', function() {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:agents' }));
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:agents' }));
	}

	var self = this;

	var handle = RocketChat.authz.getUsersInRole('livechat-agent').observeChanges({
		added(id, fields) {
			self.added('agentUsers', id, fields);
		},
		changed(id, fields) {
			self.changed('agentUsers', id, fields);
		},
		removed(id) {
			self.removed('agentUsers', id);
		}
	});

	self.ready();

	self.onStop(function() {
		handle.stop();
	});
});
