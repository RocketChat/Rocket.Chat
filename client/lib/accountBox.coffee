@AccountBox = (->
	status = 0
	self = {}

	setStatus = (status) ->
		Meteor.call('UserPresence:setDefaultStatus', status)

	toggle = ->
		if status then close() else open()

	open = ->
		if SideNav.flexStatus()
			SideNav.closeFlex()
			return;
		status = 1
		self.options.removeClass("_hidden")
		self.box.addClass("active")
		SideNav.toggleArrow 1

	close = ->
		status = 0
		self.options.addClass("_hidden")
		self.box.removeClass("active")
		SideNav.toggleArrow -1

	init = ->
		self.box = $(".account-box")
		self.options = self.box.find(".options")

	setStatus: setStatus
	toggle: toggle
	open: open
	close: close
	init: init
)()