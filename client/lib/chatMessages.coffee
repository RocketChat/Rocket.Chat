@ChatMessages = (->
	self = {}
	wrapper = {}
	input = {}

	init = ->
		wrapper = $(".messages-container").find(".wrapper")
		console.log 'ChatMessages init wrapper: ', wrapper if window.rocketDebug
		input = $(".input-message").get(0)
		self.scrollable = false
		wrapper.bind "scroll", ->
			scrollable()
		bindEvents()
		return

	isScrollable = ->
		self.scrollable

	resize = ->
		dif = 60 + $(".messages-container").find("footer").outerHeight()
		$(".messages-box").css
			height: "calc(100% - #{dif}px)"

	scrollable = ->
		wrapper = $(".messages-container").find(".wrapper")
		top = wrapper.scrollTop() + wrapper.outerHeight()
		if top == wrapper.get(0).scrollHeight
			self.scrollable = true
		else
			self.scrollable = false

	toBottom = ->
		ScrollListener.toBottom()

	send = (rid, input) ->
		if _.trim(input.value) isnt ''
			KonchatNotification.removeRoomNotification(rid)
			msg = input.value
			input.value = ''
			stopTyping()
			Meteor.call 'sendMessage', { rid: rid, msg: msg, day: window.day }

	update = (id, input) ->
		if _.trim(input.value) isnt ''
			msg = input.value
			input.value = ''
			Meteor.call 'updateMessage', { id: id, msg: msg }

	startTyping = (rid, input) ->
		if _.trim(input.value) isnt ''
			unless self.typingTimeout
				if Meteor.userId()?
					Meteor.call 'typingStatus', rid, true
				self.typingTimeout = Meteor.setTimeout ->
					stopTyping()
				, 30000

	stopTyping = ->
		self.typingTimeout = null

	startEditingLastMessage = (rid, imput) ->
		lastMessage = ChatMessage.findOne { rid: rid, t: {$exists: false}, 'u._id': Meteor.userId() }, { sort: { ts: -1 } }
		if not lastMessage?
			return

		# console.log 'chatWindowDashboard.startEditingLastMessage', lastMessage if window.rocketDebug

		Session.set 'editingMessageId', lastMessage._id

		Meteor.defer ->
			$('.input-message-editing').select().autogrow()

	stopEditingLastMessage = ->
		Session.set 'editingMessageId', undefined
		Meteor.defer ->
			$('.input-message').select()

	bindEvents = ->
		if wrapper?.length
			$(".input-message").autogrow
				postGrowCallback: ->
					resize()
					toBottom() if self.scrollable

	keydown = (rid, event) ->
		input = event.currentTarget
		k = event.which
		resize(input)
		if k is 13 and not event.shiftKey
			event.preventDefault()
			event.stopPropagation()
			send(rid, input)
		else
			keyCodes = [
				20,  # Caps lock
				16,  # Shift
				9,   # Tab
				27,  # Escape Key
				17,  # Control Key
				91,  # Windows Command Key
				19,  # Pause Break
				18,  # Alt Key
				93,  # Right Click Point Key
				45,  # Insert Key
				34,  # Page Down
				35,  # Page Up
				144, # Num Lock
				145  # Scroll Lock
			]
			keyCodes.push i for i in [35..40] # Home, End, Arrow Keys
			keyCodes.push i for i in [112..123] # F1 - F12
			unless k in keyCodes
				startTyping(rid, input)
			else if k is 38 # Arrow Up
				if input.value.trim() is ''
					startEditingLastMessage(rid, input)

	keydownEditing = (id, event) ->
		input = event.currentTarget
		k = event.which
		resize(input)
		if k is 13 and not event.shiftKey
			event.preventDefault()
			event.stopPropagation()
			update(id, input)
			stopEditingLastMessage()
		else if k is 27 # ESC
			event.preventDefault()
			event.stopPropagation()
			stopEditingLastMessage()

	isScrollable: isScrollable
	toBottom: toBottom
	keydown: keydown
	keydownEditing: keydownEditing
	stopEditingLastMessage: stopEditingLastMessage
	send: send
	init: init
)()
