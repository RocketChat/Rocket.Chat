Meteor.publish 'room', (typeName) ->
	unless this.userId
		return this.ready()

	if typeof typeName isnt 'string'
		return this.ready()

	type = typeName.substr(0, 1)
	name = typeName.substr(1)

	return RocketChat.roomTypes.runPublish(this, type, name)
