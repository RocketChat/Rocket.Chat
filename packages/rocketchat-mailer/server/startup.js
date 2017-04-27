Meteor.startup(function() {
	return RocketChat.models.Permissions.upsert('access-mailer', {
		$setOnInsert: {
			_id: 'access-mailer',
			roles: ['admin']
		}
	});
});
