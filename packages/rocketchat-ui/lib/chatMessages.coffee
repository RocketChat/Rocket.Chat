class @ChatMessages
	init: (node) ->
		this.editing = {}
		this.messageMaxSize = RocketChat.settings.get('Message_MaxAllowedSize')
		this.wrapper = $(node).find(".wrapper")
		this.input = $(node).find(".input-message").get(0)
		this.hasValue = new ReactiveVar false
		this.bindEvents()
		return

	resize: ->
		dif = 60 + $(".messages-container").find("footer").outerHeight()
		$(".messages-box").css
			height: "calc(100% - #{dif}px)"

	toPrevMessage: ->
		msgs = this.wrapper.get(0).querySelectorAll(".own:not(.system)")
		if msgs.length
			if this.editing.element
				if msgs[this.editing.index - 1]
					this.edit msgs[this.editing.index - 1], this.editing.index - 1
			else
				this.edit msgs[msgs.length - 1], msgs.length - 1

	toNextMessage: ->
		if this.editing.element
			msgs = this.wrapper.get(0).querySelectorAll(".own:not(.system)")
			if msgs[this.editing.index + 1]
				this.edit msgs[this.editing.index + 1], this.editing.index + 1
			else
				this.clearEditing()

	getEditingIndex: (element) ->
		msgs = this.wrapper.get(0).querySelectorAll(".own:not(.system)")
		index = 0
		for msg in msgs
			if msg is element
				return index
			index++
		return -1

	edit: (element, index) ->
		id = element.getAttribute("id")
		message = ChatMessage.findOne { _id: id }
		hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', message.rid)
		editAllowed = RocketChat.settings.get 'Message_AllowEditing'
		editOwn = message?.u?._id is Meteor.userId()

		return unless hasPermission or (editAllowed and editOwn)
		return if element.classList.contains("system")

		blockEditInMinutes = RocketChat.settings.get 'Message_AllowEditing_BlockEditInMinutes'
		if blockEditInMinutes? and blockEditInMinutes isnt 0
			msgTs = moment(message.ts) if message.ts?
			currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
			if currentTsDiff > blockEditInMinutes
				return

		this.clearEditing()
		this.input.value = message.msg
		this.hasValue.set true
		this.editing.element = element
		this.editing.index = index or this.getEditingIndex(element)
		this.editing.id = id
		element.classList.add("editing")
		this.input.classList.add("editing")
		$(this.input).closest('.message-form').addClass('editing');
		setTimeout =>
			this.input.focus()
		, 5

	clearEditing: ->
		if this.editing.element
			this.editing.element.classList.remove("editing")
			this.input.classList.remove("editing")
			$(this.input).closest('.message-form').removeClass('editing');
			this.editing.id = null
			this.editing.element = null
			this.editing.index = null
			this.input.value = this.editing.saved or ""
			this.hasValue.set this.input.value isnt ''
		else
			this.editing.saved = this.input.value

	send: (rid, input) ->
		if _.trim(input.value) isnt ''
			readMessage.enable()
			readMessage.readNow()
			$('.message.first-unread').removeClass('first-unread')

			msg = input.value
			msgObject = { _id: Random.id(), rid: rid, msg: msg}

			# Run to allow local encryption, and maybe other client specific actions to be run before send
			RocketChat.promises.run('onClientBeforeSendMessage', msgObject).then (msgObject) =>

				# checks for the final msgObject.msg size before actually sending the message
				if this.isMessageTooLong(msgObject.msg)
					return toastr.error t('Message_too_long')

				if this.editing.id
					this.update(this.editing.id, rid, msgObject.msg)
					return

				KonchatNotification.removeRoomNotification(rid)
				input.value = ''
				this.hasValue.set false
				this.stopTyping(rid)

				#Check if message starts with /command
				if msg[0] is '/'
					match = msg.match(/^\/([^\s]+)(?:\s+(.*))?$/m)
					if match? and RocketChat.slashCommands.commands[match[1]]
						command = match[1]
						param = match[2]
						Meteor.call 'slashCommand', {cmd: command, params: param, msg: msgObject }
						return

				Meteor.call 'sendMessage', msgObject

	deleteMsg: (message) ->
		blockDeleteInMinutes = RocketChat.settings.get 'Message_AllowDeleting_BlockDeleteInMinutes'
		if blockDeleteInMinutes? and blockDeleteInMinutes isnt 0
			msgTs = moment(message.ts) if message.ts?
			currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
			if currentTsDiff > blockDeleteInMinutes
				toastr.error(t('Message_deleting_blocked'))
				return

		Meteor.call 'deleteMessage', message, (error, result) ->
			if error
				return toastr.error error.reason

	pinMsg: (message) ->
		message.pinned = true
		Meteor.call 'pinMessage', message, (error, result) ->
			if error
				return toastr.error error.reason

	unpinMsg: (message) ->
		message.pinned = false
		Meteor.call 'unpinMessage', message, (error, result) ->
			if error
				return toastr.error error.reason

	update: (id, rid, msg) ->
		if _.trim(msg) isnt ''
			Meteor.call 'updateMessage', { _id: id, msg: msg, rid: rid }
			this.clearEditing()
			this.stopTyping(rid)

	startTyping: (rid, input) ->
		if _.trim(input.value) isnt ''
			MsgTyping.start(rid)
		else
			MsgTyping.stop(rid)

	stopTyping: (rid) ->
		MsgTyping.stop(rid)

	bindEvents: ->
		if this.wrapper?.length
			$(".input-message").autogrow
				postGrowCallback: =>
					this.resize()

	tryCompletion: (input) ->
		value = input.value.match(/[^\s]+$/)
		if value?.length > 0
			value = value[0]

			re = new RegExp value, 'i'

			user = Meteor.users.findOne username: re
			if user?
				input.value = input.value.replace value, "@#{user.username} "

	keyup: (rid, event) ->
		input = event.currentTarget
		k = event.which
		keyCodes = [
			13, # Enter
			20, # Caps lock
			16, # Shift
			9,  # Tab
			27, # Escape Key
			17, # Control Key
			91, # Windows Command Key
			19, # Pause Break
			18, # Alt Key
			93, # Right Click Point Key
			45, # Insert Key
			34, # Page Down
			35, # Page Up
			144, # Num Lock
			145 # Scroll Lock
		]
		keyCodes.push i for i in [35..40] # Home, End, Arrow Keys
		keyCodes.push i for i in [112..123] # F1 - F12

		unless k in keyCodes
			this.startTyping(rid, input)

		this.hasValue.set input.value isnt ''

	keydown: (rid, event) ->
		input = event.currentTarget
		k = event.which
		this.resize(input)
		if k is 13 and not event.shiftKey
			event.preventDefault()
			event.stopPropagation()
			this.send(rid, input)
			return

		if k is 9
			event.preventDefault()
			event.stopPropagation()
			@tryCompletion input

		if k is 27
			if this.editing.id
				event.preventDefault()
				event.stopPropagation()
				this.clearEditing()
				return
		else if k is 38 or k is 40 # Arrow Up or down
			return true if event.shiftKey

			return true if $(input).val().length and !this.editing?.id

			if k is 38
				return if input.value.slice(0, input.selectionStart).match(/[\n]/) isnt null
				this.toPrevMessage()
			else
				return if input.value.slice(input.selectionEnd, input.value.length).match(/[\n]/) isnt null
				this.toNextMessage()

			event.preventDefault()
			event.stopPropagation()

		# ctrl (command) + shift + k -> clear room messages
		else if k is 75 and ((navigator?.platform?.indexOf('Mac') isnt -1 and event.metaKey and event.shiftKey) or (navigator?.platform?.indexOf('Mac') is -1 and event.ctrlKey and event.shiftKey))
			RoomHistoryManager.clear rid

	isMessageTooLong: (message) ->
		message?.length > this.messageMaxSize

	isEmpty: ->
		return !this.hasValue.get()
