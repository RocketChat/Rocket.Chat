Meteor.startup(function() {
	RocketChat.models.Rooms.tryEnsureIndex({ 'tokenpass.token': 1 });
});
