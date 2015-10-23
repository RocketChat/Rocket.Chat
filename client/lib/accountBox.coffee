@AccountBox = (->
	status = 0
	self = {}
	options = new ReactiveVar []

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

	###
	# @param newOption:
	#          name: Button label
	#          icon: Button icon
	#          class: Class of item
	#          roles: Which roles see this options
	###
	addOption = (newOption) ->
		Tracker.nonreactive ->
			actual = options.get()
			actual.push newOption
			options.set actual

	getOptions = ->
		return _.filter options.get(), (option) ->
			if not option.roles? or RocketChat.authz.hasRole(Meteor.userId(), option.roles)
				return true

	setStatus: setStatus
	toggle: toggle
	open: open
	close: close
	init: init
	addOption: addOption
	getOptions: getOptions
)()
