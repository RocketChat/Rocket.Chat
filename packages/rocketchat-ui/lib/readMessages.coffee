### DEFINITIONS
- If window loses focus user needs to scroll or click/touch some place
- On hit ESC enable read, force read of current room and remove unread mark
- When user change room disable read until user interaction
- Only read if mark of *first-unread* is visible for user or if flag *force* was passed
- Always read the opened room
- The default method *read* has a delay of 2000ms to prevent multiple reads and to user be able to see the mark
###

# Meteor.startup ->
	# window.addEventListener 'focus', ->
		# readMessage.refreshUnreadMark(undefined, true)

@readMessage = new class
	debug: false

	callbacks: []

	constructor: ->
		@canReadMessage = false

	readNow: (force=false) ->
		console.log '--------------' if @debug
		console.log 'readMessage -> readNow init process force:', force if @debug

		self = @

		self.refreshUnreadMark()

		if force isnt true and @canReadMessage is false
			console.log 'readMessage -> readNow canceled by canReadMessage: false' if @debug
			return

		rid = Session.get 'openedRoom'
		if not rid?
			console.log 'readMessage -> readNow canceled, no rid informed' if @debug
			return

		if force is true
			console.log 'readMessage -> readNow via force rid:', rid if @debug
			return Meteor.call 'readMessages', rid, ->
				RoomHistoryManager.getRoom(rid).unreadNotLoaded.set 0
				self.refreshUnreadMark()
				self.fireRead rid

		subscription = ChatSubscription.findOne rid: rid
		if not subscription?
			console.log 'readMessage -> readNow canceled, no subscription found for rid:', rid if @debug
			return

		if subscription.alert is false and subscription.unread is 0
			console.log 'readMessage -> readNow canceled, alert', subscription.alert, 'and unread', subscription.unread if @debug
			return

		room = RoomManager.getOpenedRoomByRid rid
		if not room?
			console.log 'readMessage -> readNow canceled, no room found for typeName:', subscription.t + subscription.name if @debug
			return

		# Only read messages if user saw the first unread message
		unreadMark = $('.message.first-unread')
		if unreadMark.length > 0
			position = unreadMark.position()
			visible = position?.top >= 0
			if not visible and room.unreadSince.get()?
				console.log 'readMessage -> readNow canceled, unread mark visible:', visible, 'unread since exists', room.unreadSince.get()? if @debug
				return

		console.log 'readMessage -> readNow rid:', rid if @debug
		Meteor.call 'readMessages', rid, ->
			RoomHistoryManager.getRoom(rid).unreadNotLoaded.set 0
			self.refreshUnreadMark()
			self.fireRead rid

	read: _.debounce (force) ->
		@readNow(force)
	, 1000

	disable: ->
		@canReadMessage = false

	enable: ->
		@canReadMessage = document.hasFocus()

	isEnable: ->
		return @canReadMessage is true

	onRead: (cb) ->
		@callbacks.push cb

	fireRead: (rid) ->
		for cb in @callbacks
			cb(rid)

	refreshUnreadMark: (rid, force) ->
		self = @

		rid ?= Session.get 'openedRoom'
		if not rid?
			return

		subscription = ChatSubscription.findOne rid: rid, {reactive: false}
		if not subscription?
			return

		room = RoomManager.openedRooms[subscription.t + subscription.name]
		if not room?
			return

		$roomDom = $(room.dom)
		$roomDom.find('.message.first-unread').addClass('first-unread-opaque')

		if not subscription.alert and subscription.unread is 0
			room.unreadSince.set undefined
			return

		if not force? and subscription.rid is Session.get('openedRoom') and document.hasFocus()
			return

		$roomDom.find('.message.first-unread').removeClass('first-unread').removeClass('first-unread-opaque')

		lastReadRecord = ChatMessage.findOne
			rid: subscription.rid
			ts:
				$lt: subscription.ls
			# 'u._id':
			# 	$ne: Meteor.userId()
		,
			sort:
				ts: -1

		if not lastReadRecord? and RoomHistoryManager.getRoom(room.rid).unreadNotLoaded.get() is 0
			lastReadRecord =
				ts: new Date(0)

		if lastReadRecord? or RoomHistoryManager.getRoom(room.rid).unreadNotLoaded.get() > 0
			room.unreadSince.set subscription.ls
		else
			room.unreadSince.set undefined

		if lastReadRecord?
			firstUnreadRecord = ChatMessage.findOne
				rid: subscription.rid
				ts:
					$gt: lastReadRecord.ts
				'u._id':
					$ne: Meteor.userId()
			,
				sort:
					ts: 1

			if firstUnreadRecord?
				room.unreadFirstId = firstUnreadRecord._id
				$roomDom.find('.message#'+firstUnreadRecord._id).addClass('first-unread')


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
		key = e.which

		if key is 27
			readMessage.enable()
			readMessage.readNow(true)
			$('.message.first-unread').removeClass('first-unread')
