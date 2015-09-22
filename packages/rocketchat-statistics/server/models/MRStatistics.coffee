RocketChat.models.MRStatistics = new class asd extends RocketChat.models._Base
	constructor: ->
		@_initModel 'mr_statistics'


	# FIND ONE
	findOneById: (_id, options) ->
		query =
			_id: _id

		return @findOne query, options
