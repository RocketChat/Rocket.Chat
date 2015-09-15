RocketChat.models._Base = class
	find: ->
		return @model.find.call @model, arguments

	findOne: ->
		return @model.findOne.call @model, arguments

	insert: ->
		return @model.insert.call @model, arguments

	update: ->
		return @model.update.call @model, arguments

	upsert: ->
		return @model.upsert.call @model, arguments

	remove: ->
		return @model.remove.call @model, arguments

	allow: ->
		return @model.allow.call @model, arguments

	deny: ->
		return @model.allow.call @model, arguments
