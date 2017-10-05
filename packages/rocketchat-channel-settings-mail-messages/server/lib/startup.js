Meteor.startup(function() {
	const permission = {
		_id: 'mail-messages',
		roles: ['admin']
	};
	return RocketChat.models.Permissions.upsert(permission._id, {
		$setOnInsert: permission
	});
});
