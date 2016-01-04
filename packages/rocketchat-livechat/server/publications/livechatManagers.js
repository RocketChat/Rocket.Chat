Meteor.publish('livechat:managers', function() {
	if (!this.userId) {
		throw new Meteor.Error('not-authorized');
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
		throw new Meteor.Error('not-authorized');
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
