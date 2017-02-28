Meteor.startup(function() {
	RocketChat.models.Permissions.upsert('post-readonly', {$set: { roles: ['admin', 'owner', 'moderator'] } });
	RocketChat.models.Permissions.upsert('set-readonly', {$set: { roles: ['admin', 'owner'] } });
	RocketChat.models.Permissions.upsert('set-react-when-readonly', {$set: { roles: ['admin', 'owner'] }});
});
