import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'authorization:saveRole'(roleData) {
		return RocketChat.Services.call('authorization.saveRole', { uid: Meteor.userId(), roleData });
	},
});
