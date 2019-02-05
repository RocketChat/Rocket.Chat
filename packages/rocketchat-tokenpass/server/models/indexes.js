import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(function() {
	RocketChat.models.Rooms.tryEnsureIndex({ 'tokenpass.tokens.token': 1 });
});
