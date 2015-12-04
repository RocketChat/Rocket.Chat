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

	init = ->
		self.box = $(".account-box")
		self.options = self.box.find(".options")

	# protectedAction = (item) ->
	# 	if not item.permissions? or RocketChat.authz.hasAllPermission item.permissions
	# 		return item.route.action

	# 	return ->
	# 		BlazeLayout.render 'main',
	# 			center: 'pageContainer'
	# 			# @TODO text Not_authorized don't get the correct language
	# 			pageTitle: t('Not_authorized')
	# 			pageTemplate: 'notAuthorized'

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

	getItems = ->
		return _.filter items.get(), (item) ->
			if not item.permissions? or RocketChat.authz.hasAllPermission item.permissions
				return true

	addRoute = (newRoute) ->

		# @TODO check for mandatory fields

		FlowRouter.route newRoute.path,
			name: newRoute.name
			action: ->

				console.log 'accountBox -> action'

				Session.set 'openedRoom'
				BlazeLayout.render 'main',
					center: 'pageContainer'
					pageTitle: newRoute.pageTitle
					pageTemplate: newRoute.pageTemplate

				if newRoute.sideNav?
					Tracker.afterFlush ->
						SideNav.setFlex newRoute.sideNav
						SideNav.openFlex()


	setStatus: setStatus
	toggle: toggle
	open: open
	close: close
	init: init

	addRoute: addRoute
	addItem: addItem
	getItems: getItems
)()
