/* globals RoomRoles */

Meteor.startup(function() {
	RocketChat.callbacks.add('streamMessage', function(msg) {
		if (msg.t === 'subscription-role-added') {
			const user = Meteor.users.findOne({ username: msg.msg }, { fields: { username: 1 } });
			RoomRoles.upsert({ rid: msg.rid, 'u._id': user._id }, { $setOnInsert: { u: user }, $addToSet: { roles: msg.role } });
			// ChatMessage.update({ rid: msg.rid, 'u._id': user._id }, { $inc: { rerender: 1 } }, { multi: true }); // Update message to re-render DOM
		} else if (msg.t === 'subscription-role-removed') {
			const user = Meteor.users.findOne({ username: msg.msg });
			const userWithRole = RoomRoles.findOne({ rid: msg.rid, 'u._id': user._id, roles: msg.role });
			if (userWithRole && userWithRole.roles && userWithRole.roles.length === 1 && userWithRole.roles[0] === msg.role) {
				RoomRoles.remove({ rid: msg.rid, 'u._id': user._id, roles: msg.role });
				// ChatMessage.update({ rid: msg.rid, 'u._id': user._id }, { $inc: { rerender: 1 } }, { multi: true }); // Update message to re-render DOM
			} else if (userWithRole) {
				RoomRoles.update({ rid: msg.rid, 'u._id': user._id }, { $pull: { roles: msg.role } });
				// ChatMessage.update({ rid: msg.rid, 'u._id': user._id }, { $inc: { rerender: 1 } }, { multi: true }); // Update message to re-render DOM
			}
		}
		return msg;
	}, RocketChat.callbacks.priority.LOW, 'addOrRemoveRoomRole');
});
