Meteor.publish 'room', (typeName) ->
	unless this.userId
		return this.ready()

	console.log '[publish] room ->'.green, 'arguments:', arguments

	if typeof typeName isnt 'string'
		return this.ready()

	type = typeName.substr(0, 1)
	name = typeName.substr(1)

	options =
		fields:
			name: 1
			t: 1
			cl: 1
			u: 1
			usernames: 1

	switch type
		when 'c'
			return RocketChat.models.Rooms.findByTypeAndName 'c', name, options

		when 'p'
			user = RocketChat.models.Users.findOneById this.userId, fields: username: 1
			return RocketChat.models.Rooms.findByTypeAndNameContainigUsername 'p', name, user.username, options

		when 'd'
			user = RocketChat.models.Users.findOneById this.userId, fields: username: 1
			return RocketChat.models.Rooms.findByTypeContainigUsername 'd', user.username, options

	# Change to validate access manualy
	# if not Meteor.call 'canAccessRoom', rid, this.userId
	# 	return this.ready()
