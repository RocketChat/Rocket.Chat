/* globals RoomRoles */
Meteor.startup(function() {
	RocketChat.Notifications.onLogged('Users:NameChanged', function({_id, name}) {
		RoomRoles.update({
			'u._id': _id
		}, {
			$set: {
				'u.name': name
			}
		}, {
			multi: true
		});
	});
});
