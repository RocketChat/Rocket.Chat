Meteor.methods({
	getPermissions() {
		this.unblock();

		return RocketChat.models.Permissions.find().fetch();
	}
});


let subscriptionsReady = false;
RocketChat.models.Settings.findNotHidden().observe({
	added(record) {
		if (subscriptionsReady) {
			RocketChat.Notifications.notifyAll('permissions-changed', 'added', record);
		}
	},

	changed(record) {
		if (subscriptionsReady) {
			RocketChat.Notifications.notifyAll('permissions-changed', 'changed', record);
		}
	},

	removed(record) {
		if (subscriptionsReady) {
			RocketChat.Notifications.notifyAll('permissions-changed', 'removed', { _id: record._id });
		}
	}
});

subscriptionsReady = true;
