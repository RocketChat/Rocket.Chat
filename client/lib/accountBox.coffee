@AccountBox = (->
	status = 0
	self = {}

	toggleArrow = (status) ->
		if self.arrow.hasClass "left" or status? is -1
			self.arrow.removeClass "left"
			return
		if not self.arrow.hasClass "left" or status? is 1
			self.arrow.addClass "left"

	setStatus = (status) ->
		Meteor.call('UserPresence:setDefaultStatus', status)

	toggle = ->
		if status then close() else open()

	open = ->
		if self.arrow.hasClass "left"
			SideNav.closeFlex()
			return;
		status = 1
		self.options.removeClass("_hidden")
		self.box.addClass("active")
		toggleArrow 1

	close = ->
		status = 0
		self.options.addClass("_hidden")
		self.box.removeClass("active")
		toggleArrow -1

	init = ->
		self.box = $(".account-box")
		self.options = self.box.find(".options")
		self.arrow = self.box.find(".arrow")

	setStatus: setStatus
	toggle: toggle
	open: open
	close: close
	init: init
	toggleArrow: toggleArrow
)()