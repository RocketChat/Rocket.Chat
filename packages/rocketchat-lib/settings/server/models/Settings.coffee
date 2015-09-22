RocketChat.models.Settings = new class extends RocketChat.models._Base
	constructor: ->
		@_initModel 'settings'


	# FIND ONE
	findOneById: (_id, options) ->
		query =
			_id: _id

		return @findOne query, options


	# FIND
	findByRole: (role, options) ->
		query =
			role: role

		return @find query, options

	findPublic: (options) ->
		query =
			public: true

		return @find query, options


	# UPDATE
	updateValueById: (_id, value) ->
		query =
			_id: _id

		update =
			$set:
				value: value

		return @update query, update


	# REMOVE
	createWithIdAndValue: (_id, value) ->
		record =
			_id: _id
			value: value

		return @insert record


	# REMOVE
	removeById: (_id) ->
		query =
			_id: _id

		return @remove query
