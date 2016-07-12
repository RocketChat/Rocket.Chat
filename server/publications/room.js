const options = {
	fields: {
		name: 1,
		t: 1,
		cl: 1,
		u: 1,
		// usernames: 1,
		topic: 1,
		muted: 1,
		archived: 1,
		jitsiTimeout: 1,
		description: 1
	}
};


Meteor.methods({
	'rooms/get'() {
		if (!Meteor.userId()) {
			return [];
		}

		this.unblock();

		return _.pluck(RocketChat.cache.Subscriptions.findByUserId(Meteor.userId(), options).fetch(), '_room').map((record) => {
			return _.omit(record, '$loki');
		});
	},

	'rooms/sync'(/*updatedAt*/) {
		if (!Meteor.userId()) {
			return {};
		}

		this.unblock();

		//return RocketChat.models.Subscriptions.dinamicFindChangesAfter('findByUserId', updatedAt, Meteor.userId(), options);
		// TODO: Change
		return _.pluck(RocketChat.cache.Subscriptions.findByUserId(Meteor.userId(), options).fetch(), '_room').map((record) => {
			return _.omit(record, '$loki');
		});
	}
});

// TODO: Enable
// # RocketChat.models.Subscriptions.on 'change', (type, args...) ->
// # 	records = RocketChat.models.Subscriptions.getChangedRecords type, args[0], fields

// # 	for record in records
// # 		RocketChat.Notifications.notifyUser record.u._id, 'rooms-changed', type, record
