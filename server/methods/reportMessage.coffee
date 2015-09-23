Meteor.methods
	reportMessage: (message, description) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] reportMessage -> Invalid user"

		if not description? or description.trim() is ''
			throw new Meteor.Error 'invalid-description', "[methods] reportMessage -> Invalid description"

		RocketChat.models.Reports.createWithMessageDescriptionAndUserId message, description, Meteor.userId()
