Meteor.publish 'messages', (rid, start) ->
	unless this.userId
		return this.ready()

	console.log '[publish] messages ->'.green, 'rid:', rid, 'start:', start

	if typeof rid isnt 'string'
		return this.ready()

	if not Meteor.call 'canAccessRoom', rid, this.userId
		return this.ready()

	ChatMessage.find
		rid: rid
	,
		sort:
			ts: -1
		limit: 50
