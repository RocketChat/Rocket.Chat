Meteor.startup ->
	Meteor.defer ->
		ChatMessage._ensureIndex({ 'expireAt': 1 }, { expireAfterSeconds: 0 })
		ChatMessage._ensureIndex({ 'rid': 1 })
		ChatMessage._ensureIndex({ 'rid': 1, 'ts': 1 })
		ChatSubscription._ensureIndex({ 'u._id': 1 })
		ChatSubscription._ensureIndex({ 'ts': 1 })
		ChatSubscription._ensureIndex({ 'rid': 1, 'u._id': 1 }, {unique: true})
