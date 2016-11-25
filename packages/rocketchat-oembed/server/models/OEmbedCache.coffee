RocketChat.models.OEmbedCache = new class extends RocketChat.models._Base
	constructor: ->
		super('oembed_cache')
		@tryEnsureIndex { 'updatedAt': 1 }


	# FIND ONE
	findOneById: (_id, options) ->
		query =
			_id: _id

		return @findOne query, options


	# INSERT
	createWithIdAndData: (_id, data) ->
		record =
			_id: _id
			data: data
			updatedAt: new Date

		record._id = @insert record
		return record

	# REMOVE
	removeAfterDate: (date) ->
		query =
			updatedAt:
				$lte: date
		@remove query
