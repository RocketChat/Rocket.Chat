Meteor.startup ->
	Migrations.add
		version: 16
		up: ->
			rawMessage = ChatMessage.rawCollection()
			Meteor.wrapAsync(rawMessage.dropIndex, rawMessage)({ _hidden: 1 })
