Meteor.startup ->
	permission = { _id: 'mail-messages', roles : [ 'admin' ] }
	RocketChat.models.Permissions.upsert( permission._id, { $setOnInsert : permission })
