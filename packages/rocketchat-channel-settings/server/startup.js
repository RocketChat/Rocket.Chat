Meteor.startup(function() {
	RocketChat.models.Permissions.upsert('post-readonly', {$set: { roles: ['admin', 'owner', 'moderator'] } });
	RocketChat.models.Permissions.upsert('set-readonly', {$set: { roles: ['admin', 'owner'] } });
});
