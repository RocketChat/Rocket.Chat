@AccountBox = (->
	status = 0
	self = {}
	items = new ReactiveVar []

	setStatus = (status) ->
		Meteor.call('UserPresence:setDefaultStatus', status)

	toggle = ->
		if status then close() else open()

	open = ->
		if SideNav.flexStatus()
			SideNav.closeFlex()
			return;
		status = 1
		self.options.removeClass("animated-hidden")
		self.box.addClass("active")
		SideNav.toggleArrow 1

	close = ->
		status = 0
		self.options.addClass("animated-hidden")
		self.box.removeClass("active")
		SideNav.toggleArrow -1

	openFlex = ->
		status = 0
		self.options.addClass("animated-hidden")
		self.box.removeClass("active")

	init = ->
		self.box = $(".account-box")
		self.options = self.box.find(".options")

	###
	# @param newOption:
	#   name: Button label
	#   icon: Button icon
	#   class: Class of the item
	#   permissions: Which permissions a user should have (all of them) to see this item
	###
	addItem = (newItem) ->
		Tracker.nonreactive ->
			actual = items.get()
			actual.push newItem
			items.set actual

	checkCondition = (item) ->
		return not item.condition? or item.condition()

	getItems = ->
		return _.filter items.get(), (item) ->
			if checkCondition(item)
				return true

	addRoute = (newRoute, router = FlowRouter) ->

		# @TODO check for mandatory fields
		routeConfig =
			center: 'pageContainer'
			pageTemplate: newRoute.pageTemplate

		if newRoute.i18nPageTitle?
			routeConfig.i18nPageTitle = newRoute.i18nPageTitle

		if newRoute.pageTitle?
			routeConfig.pageTitle = newRoute.pageTitle

		router.route newRoute.path,
			name: newRoute.name
			action: ->
				Session.set 'openedRoom'
				BlazeLayout.render 'main', routeConfig
			triggersEnter: [ ->
				if newRoute.sideNav?
					SideNav.setFlex newRoute.sideNav
					SideNav.openFlex()
			]

	setStatus: setStatus
	toggle: toggle
	open: open
	close: close
	openFlex: openFlex
	init: init

	addRoute: addRoute
	addItem: addItem
	getItems: getItems
)()
