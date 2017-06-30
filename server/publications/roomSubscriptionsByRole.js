Meteor.publish('roomSubscriptionsByRole', function(rid, role) {
	if (!this.userId) {
		return this.ready();
	}

	if (RocketChat.authz.hasPermission(this.userId, 'view-other-user-channels') !== true) {
		return this.ready();
	}

	return RocketChat.models.Subscriptions.findByRoomIdAndRoles(rid, role, {
		fields: {
			rid: 1,
			name: 1,
			roles: 1,
			u: 1
		},
		sort: {
			name: 1
		}
	});
});
