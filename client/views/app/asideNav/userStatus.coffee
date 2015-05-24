AccountBox = (->
	status = 0
	self = {}
	setStatus = (status) ->
		Meteor.call('UserPresence:setDefaultStatus', status)
	toggle = ->
		if status then close() else open()
	open = ->
		status = 1
		self.options.removeClass("_hidden")
		self.box.addClass("active")
		self.arrow.addClass "left"
	close = ->
		status = 0
		self.options.addClass("_hidden")
		self.box.removeClass("active")
		self.arrow.removeClass "left"
	init = ->
		self.box = $(".account-box")
		self.options = self.box.find(".options")
		self.arrow = self.box.find(".arrow")

	setStatus: setStatus
	toggle: toggle
	open: open
	close: close
	init: init
)()

Template.userStatus.helpers
	myUserInfo: ->
		visualStatus = "online"
		switch Session.get('user_' + Meteor.userId() + '_status')
			when "away"
				visualStatus = t("userStatus.away")
			when "busy"
				visualStatus = t("userStatus.busy")
			when "offline"
				visualStatus = t("userStatus.invisible")
		return {
			name: Session.get('user_' + Meteor.userId() + '_name')
			picture: Session.get('user_' + Meteor.userId() + '_picture')
			status: Session.get('user_' + Meteor.userId() + '_status')
			visualStatus: visualStatus
			_id: Meteor.userId()
		}

Template.userStatus.events

	'click .options .status': (event) ->
		event.preventDefault()
		AccountBox.setStatus(event.currentTarget.dataset.status)

	'click .account-box': (event) ->
		AccountBox.toggle()

	'click #logout': (event) ->
		event.preventDefault()
		Meteor.logout()

	'click .silence-new-rooms': ->
		for room in Session.get('newRoomSound')
			KonchatNotification.removeRoomNotification room

		Session.set('newRoomSound', [])

Template.userStatus.rendered = ->
	AccountBox.init()
