import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
	RocketChat.models.Rooms.tryEnsureIndex({ 'tokenpass.tokens.token': 1 });
});
