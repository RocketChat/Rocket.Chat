import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(function() {
	RocketChat.models.Rooms.tryEnsureIndex({ open: 1 }, { sparse: 1 });
	RocketChat.models.Rooms.tryEnsureIndex({ departmentId: 1 }, { sparse: 1 });
	RocketChat.models.Users.tryEnsureIndex({ 'visitorEmails.address': 1 });
});
