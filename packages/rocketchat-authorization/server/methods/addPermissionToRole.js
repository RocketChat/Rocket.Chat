import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'authorization:addPermissionToRole'(permission, role) {
		return RocketChat.Services.call('authorization.addPermissionToRole', { uid: Meteor.userId(), permission, role });
	},
});
