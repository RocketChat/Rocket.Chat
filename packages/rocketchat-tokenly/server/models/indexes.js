Meteor.startup(function() {
	RocketChat.models.Rooms.tryEnsureIndex({ 'tokenpass.tokens': 1 });
});
