RocketChat.models.Reports = new class extends RocketChat.models._Base
	constructor: ->
		super('reports')


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
