/* globals UserRoles, RoomRoles */

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (Meteor.userId()) {
			Meteor.call('getUserRoles', (error, results) => {
				if (error) {
					return toastr.error(TAPi18n.__(error.error));
				}

				for (let record of results) {
					UserRoles.upsert({ _id: record._id }, record);
				}
			});

			RocketChat.Notifications.onAll('roles-change', function(role) {
				if (role.type === 'added') {
					if (role.scope) {
						RoomRoles.upsert({ rid: role.scope, 'u._id': role.u._id }, { $setOnInsert: { u: role.u }, $addToSet: { roles: role._id } });
					} else {
						UserRoles.upsert({ _id: role.u._id }, { $addToSet: { roles: role._id }, $set: { username: role.u.username } });
						ChatMessage.update({ 'u._id': role.u._id }, { $addToSet: { roles: role._id } }, { multi: true });
					}
				} else if (role.type === 'removed') {
					if (role.scope) {
						RoomRoles.update({ rid: role.scope, 'u._id': role.u._id }, { $pull: { roles: role._id } });
					} else {
						UserRoles.update({ _id: role.u._id }, { $pull: { roles: role._id } });
						ChatMessage.update({ 'u._id': role.u._id }, { $pull: { roles: role._id } }, { multi: true });
					}
				} else if (role.type === 'changed') {
					ChatMessage.update({ roles: role._id }, { $inc: { rerender: 1 } }, { multi: true });
				}
			});
		}
	});
});
