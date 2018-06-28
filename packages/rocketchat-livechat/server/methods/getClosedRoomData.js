import _ from 'underscore';

Meteor.methods({
	'livechat:getClosedRoomData'(roomId) {
		check(roomId, String);

		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-rooms')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:getClosedRoomData' });
		}

		const room = RocketChat.models.Rooms.findLivechatById(roomId, { fields: { closer: 1, closedBy: 1, closedAt: 1 }});

		if (!room || room.open) {
			return;
		}

		const fields = _.pick(room, ['_id', 'closer', 'closedBy', 'closedAt']);

		return fields;
	}
});
