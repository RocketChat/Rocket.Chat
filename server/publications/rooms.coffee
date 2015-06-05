Meteor.publish 'rooms', (rid) ->
	unless this.userId
		return this.ready()

	console.log '[publish] rooms ->'.green, 'rid:'

	if typeof rid isnt 'string'
		return this.ready()

	ChatRoom.find
		_id: rid
	,
		fields:
			name: 1
			t: 1
			cl: 1
			usernames: 1
