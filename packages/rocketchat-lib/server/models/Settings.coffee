class ModelSettings extends RocketChat.models._Base
	constructor: ->
		super(arguments...)

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

	findOneNotHiddenById: (_id) ->
		query =
			_id: _id
			hidden: { $ne: true }

		return @findOne query

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

	findNotHiddenPublicUpdatedAfter: (updatedAt) ->
		filter =
			hidden: { $ne: true }
			public: true
			_updatedAt:
				$gt: updatedAt

		return @find filter, { fields: _id: 1, value: 1 }

	findNotHiddenPrivate: ->
		return @find {
			hidden: { $ne: true }
			public: { $ne: true }
		}

	findNotHidden: (options) ->
		return @find { hidden: { $ne: true } }, options

	findNotHiddenUpdatedAfter: (updatedAt)->
		return @find {
			hidden: { $ne: true }
			_updatedAt:
				$gt: updatedAt
		}

	# UPDATE
	updateValueById: (_id, value) ->
		query =
			blocked: { $ne: true }
			value: { $ne: value }
			_id: _id

		update =
			$set:
				value: value

		return @update query, update

	updateValueAndEditorById: (_id, value, editor) ->
		query =
			blocked: { $ne: true }
			value: { $ne: value }
			_id: _id

		update =
			$set:
				value: value
				editor: editor

		return @update query, update

	updateValueNotHiddenById: (_id, value) ->
		query =
			_id: _id
			hidden: { $ne: true }
			blocked: { $ne: true }

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

RocketChat.models.Settings = new ModelSettings('settings')
