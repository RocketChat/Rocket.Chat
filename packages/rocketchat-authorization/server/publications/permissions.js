Meteor.publish('permissions', function() {
	return RocketChat.models.Permissions.find({});
});
