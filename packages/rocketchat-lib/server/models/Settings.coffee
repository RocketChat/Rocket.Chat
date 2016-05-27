RocketChat.models.Settings = new class extends RocketChat.models._Base
	constructor: ->
		@_initModel 'settings'

		@tryEnsureIndex { 'blocked': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'hidden': 1 }, { sparse: 1 }

	# FIND ONE
	findOneById: (_id, options) ->
		query =
			_id: _id

		return @findOne query, options

	# FIND
	findById: (_id) ->
		query =
			_id: _id

		return @find query

	findByIds: (_id = []) ->
		_id = [].concat _id

		query =
			_id:
				$in: _id

		return @find query

	findByRole: (role, options) ->
		query =
			role: role

		return @find query, options

	findPublic: (options) ->
		query =
			public: true

		return @find query, options

	findNotHiddenPublic: (ids = [])->
		filter =
			hidden: { $ne: true }
			public: true

		if ids.length > 0
			filter._id =
				$in: ids

		return @find filter, { fields: _id: 1, value: 1 }

	findNotHiddenPrivate: ->
		return @find {
			hidden: { $ne: true }
			public: { $ne: true }
		}

	findNotHidden: ->
		return @find { hidden: { $ne: true } }

	# UPDATE
	updateValueById: (_id, value) ->
		query =
			blocked: { $ne: true }
			_id: _id

		update =
			$set:
				value: value

		return @update query, update

	updateOptionsById: (_id, options) ->
		query =
			blocked: { $ne: true }
			_id: _id

		update =
			$set: options

		return @update query, update

	# INSERT
	createWithIdAndValue: (_id, value) ->
		record =
			_id: _id
			value: value
			_createdAt: new Date

		return @insert record

	# REMOVE
	removeById: (_id) ->
		query =
			blocked: { $ne: true }
			_id: _id

		return @remove query
