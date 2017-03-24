/* eslint new-cap: [2, {"capIsNewExceptions": ["Match.ObjectIncluding", "Match.Optional"]}] */

Meteor.methods({
	'livechat:saveInfo'(guestData, roomData) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveInfo' });
		}

		check(guestData, Match.ObjectIncluding({
			_id: String,
			name: Match.Optional(String),
			email: Match.Optional(String),
			phone: Match.Optional(String)
		}));

		check(roomData, Match.ObjectIncluding({
			_id: String,
			topic: Match.Optional(String),
			tags: Match.Optional(String)
		}));

		const room = RocketChat.models.Rooms.findOneById(roomData._id, {fields: {t: 1, servedBy: 1}});

		if (room == null || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:saveInfo' });
		}

		if ((!room.servedBy || room.servedBy._id !== Meteor.userId()) && !RocketChat.authz.hasPermission(Meteor.userId(), 'save-others-livechat-room-info')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveInfo' });
		}

		const ret = RocketChat.Livechat.saveGuest(guestData) && RocketChat.Livechat.saveRoomInfo(roomData, guestData);

		Meteor.defer(() => {
			RocketChat.callbacks.run('livechat.saveInfo', RocketChat.models.Rooms.findOneById(roomData._id));
		});

		return ret;
	}
});
