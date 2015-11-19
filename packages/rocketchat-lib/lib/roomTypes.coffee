RocketChat.roomTypes = new class
	roomTypesOrder = []
	roomTypes = {}

	### Adds a room type to app
	@param identifier MUST BE equals to `db.rocketchat_room.t` field
	@param config
		template: template name to render on sideNav
		permissions: list of permissions to see the sideNav template
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

	###
	@param roomType: room type (e.g.: c (for channels), d (for direct channels))
	@param subData: the user's subscription data
	###
	getRouteLink = (roomType, subData) ->
		unless roomTypes[roomType]?
			throw new Meteor.Error 'route-doesnt-exists', 'There is no route for the type: ' + roomType

		return FlowRouter.path roomTypes[roomType].route.name, roomTypes[roomType].route.link(subData)

	getAllTypes = ->
		typesPermitted = []
		roomTypesOrder.forEach (type) ->
			if roomTypes[type].permissions? and RocketChat.authz.hasAtLeastOnePermission roomTypes[type].permissions
				typesPermitted.push roomTypes[type]

		return typesPermitted

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
