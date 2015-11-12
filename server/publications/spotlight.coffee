Meteor.publish 'spotlight', (selector, options, collName) ->
	unless this.userId
		return this.ready()

	console.log '[publish] spotlight -> '.green, 'selector:', selector, 'options:', options, 'collName:', collName

	self = this
	subHandleUsers = null
	subHandleRooms = null

	subHandleUsers = RocketChat.models.Users.findUsersByNameOrUsername(new RegExp(selector.name.$regex, 'i'), { limit: 10, fields: { name: 1, username: 1, status: 1 } }).observeChanges
		added: (id, fields) ->
			data = { type: 'u', uid: id, name: fields.username + ' - ' + fields.name, status: fields.status }
			self.added("autocompleteRecords", id, data)
		removed: (id) ->
			self.removed("autocompleteRecords", id)

	subHandleRooms = RocketChat.models.Rooms.findByNameContainingAndTypes(selector.name.$regex, ['c'], { limit: 10, fields: { t: 1, name: 1 } }).observeChanges
		added: (id, fields) ->
			data = { type: 'r', rid: id, name: fields.name, t: fields.t }
			self.added("autocompleteRecords", id, data)
		removed: (id) ->
			self.removed("autocompleteRecords", id)

	this.ready()

	this.onStop ->
		subHandleUsers?.stop()
		subHandleRooms?.stop()
