RocketChat.roomTypes = new class
	roomTypesOrder = []
	roomTypes = {}
	mainOrder = 1

	protectedAction = (item) ->
		# if not item.permissions? or RocketChat.authz.hasAtLeastOnePermission item.permissions
		return item.route.action

		# return ->
		# 	BlazeLayout.render 'main',
		# 		center: 'pageContainer'
		# 		# @TODO text Not_authorized don't get the correct language
		# 		pageTitle: t('Not_authorized')
		# 		pageTemplate: 'notAuthorized'

	### Adds a room type to app
	@param identifier An identifier to the room type. If a real room, MUST BE the same of `db.rocketchat_room.t` field, if not, can be null
	@param order Order number of the type
	@param config
		template: template name to render on sideNav
		permissions: list of permissions to see the sideNav template
		icon: icon class
		route:
			name: route name
			action: route action function
	###
	add = (identifier, order, config) ->
		unless identifier?
			identifier = Random.id()

		if roomTypes[identifier]?
			throw new Meteor.Error 'identifier-already-set', t('Room_type_identifier_already_set')

		if not order?
			order = mainOrder + 10
			mainOrder += 10

		# @TODO validate config options
		roomTypesOrder.push
			identifier: identifier
			order: order
		roomTypes[identifier] = config

		if config.route?.path? and config.route?.name? and config.route?.action?
			FlowRouter.route config.route.path,
				name: config.route.name
				action: protectedAction config
				triggersExit: [roomExit]

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

		_.sortBy(roomTypesOrder, 'order').forEach (type) ->
			if not roomTypes[type.identifier].permissions? or RocketChat.authz.hasAtLeastOnePermission roomTypes[type.identifier].permissions
				typesPermitted.push roomTypes[type.identifier]

		return typesPermitted

	getIcon = (roomType) ->
		return roomTypes[roomType]?.icon

	getIdentifiers = (except) ->
		except = [].concat except
		list = _.reject roomTypesOrder, (t) -> return except.indexOf(t.identifier) isnt -1
		return _.map list, (t) -> return t.identifier

	# addType: addType
	getTypes: getAllTypes
	getIdentifiers: getIdentifiers

	# setIcon: setIcon
	getIcon: getIcon

	# setRoute: setRoute
	getRouteLink: getRouteLink

	add: add
