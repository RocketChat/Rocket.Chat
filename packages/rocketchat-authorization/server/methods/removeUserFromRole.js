import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
Meteor.methods({
	'authorization:removeUserFromRole'(roleName, username, scope) {
		return RocketChat.Services.call('authorization.removeUserFromRole', { uid: Meteor.userId(), roleName, username, scope });
	},
});
