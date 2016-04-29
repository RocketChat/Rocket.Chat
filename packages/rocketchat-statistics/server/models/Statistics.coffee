RocketChat.models.Statistics = new class extends RocketChat.models._Base
	constructor: ->
		@_initModel 'statistics'

		@tryEnsureIndex { 'createdAt': 1 }

	# FIND ONE
	findOneById: (_id, options) ->
		query =
			_id: _id

		return @findOne query, options

	findLast: ->
		options =
			sort:
				createdAt: -1
			limit: 1
		return @find({}, options).fetch()?[0]
