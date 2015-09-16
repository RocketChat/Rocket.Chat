RocketChat.models._Base = class
	find: ->
		return @model.find.apply @model, arguments

	findOne: ->
		return @model.findOne.apply @model, arguments

	insert: ->
		return @model.insert.apply @model, arguments

	update: ->
		return @model.update.apply @model, arguments

	upsert: ->
		return @model.upsert.apply @model, arguments

	remove: ->
		return @model.remove.apply @model, arguments

	allow: ->
		return @model.allow.apply @model, arguments

	deny: ->
		return @model.allow.apply @model, arguments

	ensureIndex: ->
		@model._ensureIndex.apply @model, arguments

	dropIndex: ->
		@model._dropIndex.apply @model, arguments

	tryEnsureIndex: ->
		try
			return @ensureIndex.apply @model, arguments
		catch e
			console.log e

	tryDropIndex: ->
		try
			return @dropIndex.apply @model, arguments
		catch e
			console.log e
