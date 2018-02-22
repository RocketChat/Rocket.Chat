Meteor.startup(function() {

	RocketChat.models.Permissions.upsert('search-admin', {
		$setOnInsert: {
			_id: 'search-admin',
			roles: ['admin']
		}
	});

	RocketChat.settings.addGroup('Search');
});
