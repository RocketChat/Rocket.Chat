/* globals RoomModeratorsAndOwners */

Meteor.startup(function() {
	RocketChat.callbacks.add('streamMessage', function(msg) {
		if (msg.t === 'new-moderator') {
			const user = Meteor.users.findOne({ username: msg.msg }, { fields: { username: 1 } });
			RoomModeratorsAndOwners.upsert({ rid: msg.rid, 'u._id': user._id }, { $setOnInsert: { u: user }, $addToSet: { roles: 'moderator' } });
		} else if (msg.t === 'moderator-removed') {
			const user = Meteor.users.findOne({ username: msg.msg });
			const moderator = RoomModeratorsAndOwners.findOne({ rid: msg.rid, 'u._id': user._id, roles: 'moderator' });
			if (moderator && moderator.roles && moderator.roles.length === 1 && moderator.roles[0] === 'moderator') {
				RoomModeratorsAndOwners.remove({ rid: msg.rid, 'u._id': user._id, roles: 'moderator' });
			} else if (moderator) {
				RoomModeratorsAndOwners.update({ rid: msg.rid, 'u._id': user._id }, { $pull: { roles: 'moderator' } });
			}
		}
		return msg;
	}, RocketChat.callbacks.priority.LOW, 'addOrRemoveModerator');

	RocketChat.callbacks.add('streamMessage', function(msg) {
		if (msg.t === 'new-owner') {
			const user = Meteor.users.findOne({ username: msg.msg }, { fields: { username: 1 } });
			RoomModeratorsAndOwners.upsert({ rid: msg.rid, 'u._id': user._id }, { $setOnInsert: { u: user }, $addToSet: { roles: 'owner' } });
		} else if (msg.t === 'owner-removed') {
			const user = Meteor.users.findOne({ username: msg.msg });
			const owner = RoomModeratorsAndOwners.findOne({ rid: msg.rid, 'u._id': user._id, roles: 'owner' });
			if (owner && owner.roles && owner.roles.length === 1 && owner.roles[0] === 'owner') {
				RoomModeratorsAndOwners.remove({ rid: msg.rid, 'u._id': user._id, roles: 'owner' });
			} else if (owner) {
				RoomModeratorsAndOwners.update({ rid: msg.rid, 'u._id': user._id }, { $pull: { roles: 'owner' } });
			}
		}
		return msg;
	}, RocketChat.callbacks.priority.LOW, 'addOrRemoveOwner');
});
