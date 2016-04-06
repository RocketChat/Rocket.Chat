RocketChat.models._Base = class
	_baseName: ->
		return 'rocketchat_'

	_initModel: (name) ->
		check name, String

		@model = new Mongo.Collection @_baseName() + name

	find: ->
		return @model.find.apply @model, arguments

	findOne: ->
		return @model.findOne.apply @model, arguments

	insert: ->
		return @model.insert.apply @model, arguments

	insertOrUpsert: (args...) ->
		if args[0]?._id?
			_id = args[0]._id
			delete args[0]._id
			args.unshift
				_id: _id
			@model.upsert.apply @model, args
			return _id
		else
			return @model.insert.apply @model, args

	update: ->
		return @model.update.apply @model, arguments

	upsert: ->
		return @model.upsert.apply @model, arguments

	remove: ->
		return @model.remove.apply @model, arguments

	allow: ->
		return @model.allow.apply @model, arguments

	deny: ->
		return @model.deny.apply @model, arguments

	ensureIndex: ->
		return @model._ensureIndex.apply @model, arguments

	dropIndex: ->
		return @model._dropIndex.apply @model, arguments

	tryEnsureIndex: ->
		try
			return @ensureIndex.apply @, arguments
		catch e
			console.log e

	tryDropIndex: ->
		try
			return @dropIndex.apply @, arguments
		catch e
			console.log e
