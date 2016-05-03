Meteor.publish('livechat:managers', function() {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:managers' }));
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:managers' }));
	}

	var self = this;

	var handle = RocketChat.authz.getUsersInRole('livechat-manager').observeChanges({
		added(id, fields) {
			self.added('managerUsers', id, fields);
		},
		changed(id, fields) {
			self.changed('managerUsers', id, fields);
		},
		removed(id) {
			self.removed('managerUsers', id);
		}
	});

	self.ready();

	self.onStop(function() {
		handle.stop();
	});
});
