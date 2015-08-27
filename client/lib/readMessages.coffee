### DEFINITIONS
- If window loses focus user needs to scroll or click/touch some place inside messages-box
- On hit ESC enable read and force read of current room
- When user change room disable read until user interaction
- Only read if mark of *first-unread* is visible for user or if flag *force* was passed
- Always read the opened room
- The default method *read* has a delay of 2000ms to prevent multiple reads and to user be able to see the mark
###

@readMessage = new class
	constructor: ->
		@canReadMessage = false

	readNow: (force=false) ->
		return if @canReadMessage is false

		rid = Session.get 'openedRoom'
		if rid?
			subscription = ChatSubscription.findOne rid: rid
			if subscription? and (subscription.alert is true or subscription.unread > 0)
				# Only read messages if user saw the first unread message
				position = $('.message.first-unread').position()
				console.log position
				if force is true or not position? or position.top >= 0
					Meteor.call 'readMessages', rid

	read: _.debounce (force) ->
		@readNow(force)
	, 2000

	disable: ->
		@canReadMessage = false

	enable: ->
		@canReadMessage = document.hasFocus()

	isEnable: ->
		return @canReadMessage is true


Meteor.startup ->
	$(window).on 'blur', ->
		readMessage.disable()

	$(window).on 'click', (e) ->
		if $(e.target).closest('.messages-container').length > 0
			readMessage.enable()
			readMessage.read()

	$(window).on 'touchend', (e) ->
		if $(e.target).closest('.messages-container').length > 0
			readMessage.enable()
			readMessage.read()

	$(window).on 'keyup', (e) ->
		key = event.which

		if key is 27
			readMessage.enable()
			readMessage.readNow(true)
