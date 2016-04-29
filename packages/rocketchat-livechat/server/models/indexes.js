Meteor.startup(function() {
	RocketChat.models.Rooms.tryEnsureIndex({ code: 1 });
});
