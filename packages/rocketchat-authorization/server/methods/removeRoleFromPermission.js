import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'authorization:removeRoleFromPermission'(permission, roleName) {
		return RocketChat.Services.call('authorization.removeRoleFromPermission', { uid: Meteor.userId(), roleName, permission });
	},
});
