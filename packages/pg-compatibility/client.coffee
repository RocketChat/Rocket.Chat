class Collection
	constructor: (name) ->
		@collection = new PG.Table name
		return @

	find: ->
		@collection.minimongo.find()

	findOne: ->
		@collection.minimongo.findOne()

	insert: ->
		@collection.minimongo.insert()

	update: ->
		@collection.minimongo.update()

	upsert: ->
		@collection.minimongo.upsert()

	remove: ->
		@collection.minimongo.remove()

Meteor.Collection = Collection