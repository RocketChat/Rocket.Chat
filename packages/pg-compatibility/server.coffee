class Collection
	constructor: (name) ->
		@collection = new PG.Table name
		@collection.observe = (options) =>
			query = new PG.Query(@collection.toString(), @collection._getCollectionName())
			return query.observe(options)
		return @

	find: ->
		return @collection

	findOne: ->
		@find().fetch()[0]

	insert: (values) ->
		@collection.insert(values).run()

	update: (query, values) ->
		for key, value of values
			if Array.isArray(value)
				values[key] = JSON.stringify(value)

		@collection.update(values).run()

	upsert: ->
		#todo

	remove: ->
		#todo

	observe: ->
		@collection.fetch()

	observeChanges: ->
		@collection.fetch()

	_ensureIndex: ->
		#todo

Meteor.Collection = Collection
Meteor.users = new Collection 'users'