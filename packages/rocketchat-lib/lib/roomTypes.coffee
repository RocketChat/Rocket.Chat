RocketChat.roomTypes = new class
	# rooms = []
	# routes = {}
	# publishes = {}
	# icons = {}

	roomTypesOrder = []
	roomTypes = {}

	### Adds a room type to app
	@param identifier MUST BE equals to `db.rocketchat_room.t` field
	@param config
		template: template name to render on sideNav
		permission: list of permissions to see the sideNav template
		icon: icon class
		route:
			name: route name
			action: route action function
	###
	add = (identifier, config) ->
		if roomTypes[identifier]?
			throw new Meteor.Error 'identifier-already-set', t('Room_type_identifier_already_set')

		# @TODO validate config options
		roomTypesOrder.push identifier
		roomTypes[identifier] = config

	# ### Sets a route for a room type
	# @param roomType: room type (e.g.: c (for channels), d (for direct channels))
	# @param routeName: route's name for given type
	# @param dataCallback: callback for the route data. receives the whole subscription data as parameter
	# ###
	# setRoute = (roomType, routeName, dataCallback) ->
	# 	if routes[roomType]?
	# 		throw new Meteor.Error 'route-callback-exists', 'Route callback for the given type already exists'

	# 	# dataCallback ?= -> return {}

	# 	routes[roomType] =
	# 		name: routeName
	# 		data: dataCallback or -> return {}

	###
	@param roomType: room type (e.g.: c (for channels), d (for direct channels))
	@param subData: the user's subscription data
	###
	getRouteLink = (roomType, subData) ->
		unless roomTypes[roomType]?
			throw new Meteor.Error 'route-doesnt-exists', 'There is no route for the type: ' + roomType

		return FlowRouter.path roomTypes[roomType].route.name, roomTypes[roomType].route.link(subData)

	# ### add a type of room
	# @param template: the name of the template to render on sideNav
	# @param roles[]: a list of roles a user must have to see the template
	# ###
	# addType = (template, roles = []) ->
	# 	rooms.push
	# 		template: template
	# 		roles: [].concat roles

	getAllTypes = ->
		return _.map roomTypesOrder, (type) -> return roomTypes[type]

	### add a publish for a room type
	@param roomType: room type (e.g.: c (for channels), d (for direct channels))
	@param callback: function that will return the publish's data
	###
	setPublish = (roomType, callback) ->
		if roomTypes[roomType]?.publish?
			throw new Meteor.Error 'route-publish-exists', 'Publish for the given type already exists'

		unless roomTypes[roomType]?
			roomTypesOrder.push roomType
			roomTypes[roomType] = {}

		roomTypes[roomType].publish = callback

	### run the publish for a room type
	@param roomType: room type (e.g.: c (for channels), d (for direct channels))
	@param identifier: identifier of the room
	###
	runPublish = (roomType, identifier) ->
		return unless roomTypes[roomType].publish?
		return roomTypes[roomType].publish.call this, identifier

	getIcon = (roomType) ->
		return roomTypes[roomType]?.icon

	# ###
	# @param roomType: room type (e.g.: c (for channels), d (for direct channels))
	# @param iconClass: iconClass to display on sideNav
	# ###
	# setIcon = (roomType, iconClass) ->
	# 	icons[roomType] = iconClass

	getIdentifiers = (except) ->
		except = [].concat except
		return _.reject roomTypesOrder, (t) -> return except.indexOf(t) isnt -1

	# addType: addType
	getTypes: getAllTypes
	getIdentifiers: getIdentifiers

	# setIcon: setIcon
	getIcon: getIcon

	# setRoute: setRoute
	getRouteLink: getRouteLink

	setPublish: setPublish
	runPublish: runPublish

	add: add
