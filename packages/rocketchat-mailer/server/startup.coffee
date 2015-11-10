Meteor.startup ->
	RocketChat.models.Permissions.upsert( 'access-rocket-mailer', { $setOnInsert : { _id: 'access-rocket-mailer', roles : ['admin'] } })
