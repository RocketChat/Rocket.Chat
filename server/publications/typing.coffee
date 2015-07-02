Meteor.publish 'typing', (rid, start) ->
	unless this.userId
		return this.ready()

	console.log '[publish] typing ->'.green, 'rid:', rid, 'start:', start

	if typeof rid isnt 'string'
		return this.ready()

	if not Meteor.call 'canAccessRoom', rid, this.userId
		return this.ready()

	ChatTyping.find
		rid: rid
		'u._id': { $ne: this.userId }
	,
		limit: 5