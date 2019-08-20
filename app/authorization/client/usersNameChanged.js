import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../notifications';
import { RoomRoles } from '../../models';

Meteor.startup(function() {
	Notifications.onLogged('Users:NameChanged', function({ _id, name }) {
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
