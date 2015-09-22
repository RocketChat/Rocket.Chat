RocketChat.models.Reports = new class asd extends RocketChat.models._Base
	constructor: ->
		@model = new Meteor.Collection 'rocketchat_reports'


	# INSERT
	createWithMessageDescriptionAndUserId: (message, description, userId, extraData) ->
		record =
			message: message
			description: description
			ts: new Date()
			userId: userId

		_.extend record, extraData

		record._id = @insert record
		return record
