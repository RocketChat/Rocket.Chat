import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
Meteor.methods({
	'authorization:deleteRole'(roleName) {
		return RocketChat.Services.call('authorization.addUserToRole', { uid: Meteor.userId(), roleName });
	},
});
