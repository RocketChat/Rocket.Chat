Meteor.publish 'room', (typeName) ->
	if not this.userId and RocketChat.settings.get("Accounts_AnonymousAccess") is 'None'
		return this.ready()

	if typeof typeName isnt 'string'
		return this.ready()

	type = typeName.substr(0, 1)
	name = typeName.substr(1)

	return RocketChat.roomTypes.runPublish.call(this, type, name)
