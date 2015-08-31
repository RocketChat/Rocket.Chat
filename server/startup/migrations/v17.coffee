Meteor.startup ->
	Migrations.add
		version: 17
		up: ->
			rawMessage = ChatMessage.rawCollection()
			try
				Meteor.wrapAsync(rawMessage.dropIndex, rawMessage)({ _hidden: 1 })
			catch e
				console.log e
