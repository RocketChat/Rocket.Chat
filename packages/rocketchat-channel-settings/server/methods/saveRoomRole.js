import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	saveRoomRole(rid, role) {
		const room = RocketChat.models.Rooms.findOneById(rid);
		if (!room.roles) {
			room.roles = {};
		}
		if (!room.roles[role]) {
			room.roles[role] = [];
		}
		RocketChat.models.Rooms.update({
			_id: rid,
		},
		{
			$set: {
				'room.roles': room.roles,
			},
		}
		);
	},
});
