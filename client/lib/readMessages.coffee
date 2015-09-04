### DEFINITIONS
- If window loses focus user needs to scroll or click/touch some place
- On hit ESC enable read, force read of current room and remove unread mark
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

	refreshUnreadMark: (rid) ->
		rid ?= Session.get 'openedRoom'
		if rid?
			subscription = ChatSubscription.findOne rid: rid
			if not subscription? then return

			room = RoomManager.openedRooms[subscription.t + subscription.name]
			if room?
				$roomDom = $(room.dom)
				$roomDom.find('.message.first-unread').addClass('first-unread-opaque')
				if (subscription.rid isnt rid or readMessage.isEnable() is false) and (subscription.alert or subscription.unread > 0)
					$roomDom.find('.message.first-unread').removeClass('first-unread').removeClass('first-unread-opaque')
					firstUnreadId = ChatMessage.findOne({rid: subscription.rid, ts: {$gt: subscription.ls}, 'u._id': {$ne: Meteor.userId()}}, {sort: {ts: 1}})?._id
					if firstUnreadId?
						$roomDom.find('.message#'+firstUnreadId).addClass('first-unread')


Meteor.startup ->
	$(window).on 'blur', ->
		readMessage.disable()

	$(window).on 'focus', ->
		readMessage.enable()
		readMessage.read()

	$(window).on 'click', (e) ->
		readMessage.enable()
		readMessage.read()

	$(window).on 'touchend', (e) ->
		readMessage.enable()
		readMessage.read()

	$(window).on 'keyup', (e) ->
		key = event.which

		if key is 27
			readMessage.enable()
			readMessage.readNow(true)
			$('.message.first-unread').removeClass('first-unread')
