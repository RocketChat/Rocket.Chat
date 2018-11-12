import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { RoomRoles } from 'meteor/rocketchat:ui';

Meteor.startup(function() {
	RocketChat.Notifications.onLogged('Users:NameChanged', function({ _id, name }) {
		RoomRoles.update({
			'u._id': _id,
		}, {
			$set: {
				'u.name': name,
			},
		}, {
			multi: true,
		});
	});
});
