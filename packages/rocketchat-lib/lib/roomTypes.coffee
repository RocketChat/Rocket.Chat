RocketChat.roomTypes = new class
	rooms = []
	routes = {}
	publishes = {}

	### Sets a route for a room type
	@param roomType: room type (e.g.: c (for channels), d (for direct channels))
	@param routeName: route's name for given type
	@param dataCallback: callback for the route data. receives the whole subscription data as parameter
	###
	setRoute = (roomType, routeName, dataCallback) ->
		if routes[roomType]?
			throw new Meteor.Error 'route-callback-exists', 'Route callback for the given type already exists'

		# dataCallback ?= -> return {}

		routes[roomType] =
			name: routeName
			data: dataCallback or -> return {}

	###
	@param roomType: room type (e.g.: c (for channels), d (for direct channels))
	@param subData: the user's subscription data
	###
	getRoute = (roomType, subData) ->
		unless routes[roomType]?
			throw new Meteor.Error 'route-doesnt-exists', 'There is no route for the type: ' + roomType

		return FlowRouter.path routes[roomType].name, routes[roomType].data(subData)

	### add a type of room
	@param template: the name of the template to render on sideNav
	@param roles[]: a list of roles a user must have to see the template
	###
	addType = (template, roles = []) ->
		rooms.push
			template: template
			roles: [].concat roles

	getAllTypes = ->
		return rooms

	### add a publish for a room type
	@param roomType: room type (e.g.: c (for channels), d (for direct channels))
	@param callback: function that will return the publish's data
	###
	addPublish = (roomType, callback) ->
		if publishes[roomType]?
			throw new Meteor.Error 'route-publish-exists', 'Publish for the given type already exists'

		publishes[roomType] = callback

	### run the publish for a room type
	@param roomType: room type (e.g.: c (for channels), d (for direct channels))
	@param identifier: identifier of the room
	###
	runPublish = (roomType, identifier) ->
		return unless publishes[roomType]?
		return publishes[roomType].call this, identifier

	addType: addType
	getTypes: getAllTypes

	setRoute: setRoute
	getRoute: getRoute

	addPublish: addPublish
	publish: runPublish
