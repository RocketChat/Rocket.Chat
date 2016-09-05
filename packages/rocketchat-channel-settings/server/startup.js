Meteor.startup(function() {
	RocketChat.models.Permissions.upsert('set-readonly', {$set: { roles: ['admin', 'owner'] } });
});
