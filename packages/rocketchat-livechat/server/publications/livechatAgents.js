Meteor.publish('livechat:agents', function() {
	if (!this.userId) {
		throw new Meteor.Error('not-authorized');
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
		throw new Meteor.Error('not-authorized');
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
