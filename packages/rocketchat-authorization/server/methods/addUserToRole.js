import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'authorization:addUserToRole'(roleName, username, scope) {
		return RocketChat.Services.call('authorization.addUserToRole', { uid: Meteor.userId(), roleName, username, scope });
	},
});
