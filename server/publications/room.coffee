Meteor.publish 'room', (typeName) ->
	unless this.userId
		return this.ready()

	console.log '[publish] room ->'.green, 'arguments:', arguments

	if typeof typeName isnt 'string'
		return this.ready()

	type = typeName.substr(0, 1)
	name = typeName.substr(1)

	return RocketChat.roomTypes.publish.call(this, type, name)
