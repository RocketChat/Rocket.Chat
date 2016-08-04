const options = {
	fields: Object.keys({
		_id: 1,
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
	})
};


const roomMap = (record) => {
	if (record._room) {
		return _.pick(record._room, ...options.fields);
	}
	console.log('Empty Room for Subscription', record);
	return {};
};


Meteor.methods({
	'rooms/get'(updatedAt) {
		if (!Meteor.userId()) {
			return [];
		}

		this.unblock();

		const data = RocketChat.cache.Subscriptions.findByUserId(Meteor.userId()).fetch();

		if (updatedAt instanceof Date) {
			return {
				update: data
					.filter(record => { return record._room && record._room._updatedAt > updatedAt; })
					.map(roomMap),
				remove: RocketChat.models.Subscriptions.trashFindDeletedAfter(updatedAt, {'u._id': Meteor.userId()}, {fields: {_id: 1, _deletedAt: 1}}).fetch()
			};
		}

		return data.map(roomMap);
	},

	getRoomByTypeAndName(type, name) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomByTypeAndName' });
		}

		const room = RocketChat.cache.Rooms.findByIndex('t,name', [type, name]).fetch();

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getRoomByTypeAndName' });
		}

		if (!Meteor.call('canAccessRoom', room._id, Meteor.userId())) {
			throw new Meteor.Error('error-no-permission', 'No permission', { method: 'getRoomByTypeAndName' });
		}

		return roomMap({_room: room});
	}
});

RocketChat.cache.Rooms.on('sync', (type, room/*, diff*/) => {
	const records = RocketChat.cache.Subscriptions.findByIndex('rid', room._id).fetch();
	for (const record of records) {
		RocketChat.Notifications.notifyUserInThisInstance(record.u._id, 'rooms-changed', type, roomMap({_room: room}));
	}
});

RocketChat.cache.Subscriptions.on('changed', (type, subscription/*, diff*/) => {
	if (type === 'inserted') {
		const room = RocketChat.cache.Rooms.findByIndex('_id', subscription.rid).fetch();
		if (room) {
			RocketChat.Notifications.notifyUserInThisInstance(subscription.u._id, 'rooms-changed', type, roomMap({_room: room}));
		}
	}
});
