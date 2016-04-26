Meteor.methods
	reportMessage: (message, description) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'reportMessage' }

		if not description? or description.trim() is ''
			throw new Meteor.Error 'error-invalid-description', 'Invalid description', { method: 'reportMessage' }

		RocketChat.models.Reports.createWithMessageDescriptionAndUserId message, description, Meteor.userId()
