/* globals RocketChat */
import {RocketChat} from 'meteor/rocketchat:lib';

const _createRolesAndPermissions = function() {
	const permissions = [
		{_id: 'create-r', roles: ['admin', 'user', 'bot', 'guest', 'expert']},
		{_id: 'create-e', roles: ['admin', 'expert', 'bot']},
		{_id: 'delete-r', roles: ['admin']},
		{_id: 'delete-e', roles: ['admin']},
		{_id: 'view-r-room', roles: ['admin', 'user', 'bot', 'expert']}, //guests shall not view other requests
		{_id: 'view-e-room', roles: ['admin', 'user', 'bot', 'expert']}
	];

	for (const permission of permissions) {
		if (!RocketChat.models.Permissions.findOneById(permission._id)) {
			RocketChat.models.Permissions.upsert(permission._id, {$set: permission});
		}
	}

	const defaultRoles = [
		{name: 'expert', scope: 'Users', description: 'Expert'}
	];

	for (const role of defaultRoles) {
		RocketChat.models.Roles.upsert({_id: role.name}, {
			$setOnInsert: {
				scope: role.scope,
				description: role.description || '',
				protected: true
			}
		});
	}
};

const _registerExpertsChannelCallback = function() {
	RocketChat.callbacks.add('afterJoinRoom', function(user, room) {
		const expertRoomName = RocketChat.settings.get('Assistify_Expert_Channel');

		if (room.name === expertRoomName) {
			RocketChat.authz.addUserRoles(user._id, 'expert');
		}
	});

	RocketChat.callbacks.add('afterLeaveRoom', function(user, room) {
		const expertRoomName = RocketChat.settings.get('Assistify_Expert_Channel');

		if (room.name === expertRoomName) {
			RocketChat.authz.removeUserFromRoles(user._id, 'expert');
		}
	});
};

/**
 * Adds current members of the expert channel as experts.
 * Experts who have got this role via another mechanism (e. g. by adding them to the expert role manually)
 * are intentionally not removed
 * @private
 */
const _makeExpertChannelMembersExperts = function() {
	const expertRoomName = RocketChat.settings.get('Assistify_Expert_Channel');
	const expertRoom = RocketChat.models.Rooms.findOneByName(expertRoomName);
	if (expertRoom && expertRoom.usernames && expertRoom.usernames.length) {
		const expertUsers = RocketChat.models.Users.findByUsernames(expertRoom.usernames).fetch();
		for (const user of expertUsers) {
			RocketChat.authz.addUserRoles(user._id, 'expert');
		}
	}
};

Meteor.startup(() => {
	_createRolesAndPermissions();
	_registerExpertsChannelCallback();
	_makeExpertChannelMembersExperts();
});
