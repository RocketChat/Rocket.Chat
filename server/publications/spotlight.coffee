Meteor.publish 'spotlight', (selector, options, collName) ->
	if not this.userId? or not selector?.name?.$regex?
		return this.ready()

	self = this
	subHandleUsers = null
	subHandleRooms = null

	subHandleUsers = RocketChat.models.Users.findUsersByNameOrUsername(new RegExp(selector.name.$regex, 'i'), { limit: 10, fields: { name: 1, username: 1, status: 1 }, sort: { name: 1 } }).observeChanges
		added: (id, fields) ->
			data = { type: 'u', uid: id, username: fields.username, name: fields.username + ' - ' + fields.name, status: fields.status }
			self.added("autocompleteRecords", id, data)
		removed: (id) ->
			self.removed("autocompleteRecords", id)

	subHandleRooms = RocketChat.models.Rooms.findByNameContainingAndTypes(selector.name.$regex, ['c'], { limit: 10, fields: { t: 1, name: 1 }, sort: {name: 1}}).observeChanges
		added: (id, fields) ->
			data = { type: 'r', rid: id, name: fields.name, t: fields.t }
			self.added("autocompleteRecords", id, data)
		removed: (id) ->
			self.removed("autocompleteRecords", id)

	this.ready()

	this.onStop ->
		subHandleUsers?.stop()
		subHandleRooms?.stop()
