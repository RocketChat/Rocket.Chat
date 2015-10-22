RocketChat.roomTypes = new class
	rooms = []

	add = (template, roles = []) ->
		rooms.push
			template: template
			roles: [].concat roles

	getAll = ->
		return rooms

	add: add
	get: getAll
