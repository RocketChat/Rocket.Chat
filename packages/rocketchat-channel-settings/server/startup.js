Meteor.startup(function() {
	RocketChat.models.Permissions.upsert('post-readonly', {$setOnInsert: { roles: ['admin', 'owner', 'moderator'] } });
	RocketChat.models.Permissions.upsert('set-readonly', {$setOnInsert: { roles: ['admin', 'owner'] } });
	RocketChat.models.Permissions.upsert('set-react-when-readonly', {$setOnInsert: { roles: ['admin', 'owner'] }});
});
