import toastr from 'toastr'
class @ChatMessages
	init: (node) ->
		this.editing = {}

		# this.messageMaxSize = RocketChat.settings.get('Message_MaxAllowedSize')
		this.wrapper = $(node).find(".wrapper")
		this.input = $(node).find(".input-message").get(0)
		# this.bindEvents()
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
		return if element.classList.contains("system")
		this.clearEditing()
		id = element.getAttribute("id")
		message = ChatMessage.findOne { _id: id, 'u._id': Meteor.userId() }
		this.input.value = message.msg
		this.editing.element = element
		this.editing.index = index or this.getEditingIndex(element)
		this.editing.id = id
		element.classList.add("editing")
		this.input.classList.add("editing")
		setTimeout =>
			this.input.focus()
		, 5

	clearEditing: ->
		if this.editing.element
			this.editing.element.classList.remove("editing")
			this.input.classList.remove("editing")
			this.editing.id = null
			this.editing.element = null
			this.editing.index = null
			this.input.value = this.editing.saved or ""
		else
			this.editing.saved = this.input.value

	send: (rid, input) ->
		if s.trim(input.value) isnt ''
			if this.isMessageTooLong(input)
				return toastr.error t('Message_too_long')
			# KonchatNotification.removeRoomNotification(rid)
			msg = input.value
			input.value = ''
			rid ?= visitor.getRoom(true)

			sendMessage = (callback) ->
				msgObject = {
					_id: Random.id(),
					rid: rid,
					msg: msg,
					token: visitor.getToken()
				}
				MsgTyping.stop(rid)

				Meteor.call 'sendMessageLivechat', msgObject, (error, result) ->
					if error
						ChatMessage.update msgObject._id, { $set: { error: true } }
						showError error.reason

					if result?.rid? and not visitor.isSubscribed(result.rid)
						Livechat.connecting = result.showConnecting
						ChatMessage.update result._id, _.omit(result, '_id')
						Livechat.room = result.rid

						parentCall('callback', 'chat-started');

			if not Meteor.userId()
				guest = {
					token: visitor.getToken()
				}

				if Livechat.department
					guest.department = Livechat.department

				Meteor.call 'livechat:registerGuest', guest, (error, result) ->
					if error?
						return showError error.reason

					Meteor.loginWithToken result.token, (error) ->
						if error
							return showError error.reason

						sendMessage()
			else
				sendMessage()

	deleteMsg: (message) ->
		Meteor.call 'deleteMessage', message, (error, result) ->
			if error
				return handleError(error)

	update: (id, rid, input) ->
		if s.trim(input.value) isnt ''
			msg = input.value
			Meteor.call 'updateMessage', { id: id, msg: msg }
			this.clearEditing()
			MsgTyping.stop(rid)

	startTyping: (rid, input) ->
		if s.trim(input.value) isnt ''
			MsgTyping.start(rid)
		else
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

	keydown: (rid, event) ->
		input = event.currentTarget
		k = event.which
		this.resize(input)
		if k is 13 and not event.shiftKey and not event.ctrlKey and not event.altKey # Enter without shift/ctrl/alt
			event.preventDefault()
			event.stopPropagation()
			if this.editing.id
				this.update(this.editing.id, rid, input)
			else
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
		# else if k is 38 or k is 40 # Arrow Up or down
		# 	if k is 38
		# 		return if input.value.slice(0, input.selectionStart).match(/[\n]/) isnt null
		# 		this.toPrevMessage()
		# 	else
		# 		return if input.value.slice(input.selectionEnd, input.value.length).match(/[\n]/) isnt null
		# 		this.toNextMessage()

		# 	event.preventDefault()
		# 	event.stopPropagation()

		# ctrl (command) + shift + k -> clear room messages
		else if k is 75 and ((navigator?.platform?.indexOf('Mac') isnt -1 and event.metaKey and event.shiftKey) or (navigator?.platform?.indexOf('Mac') is -1 and event.ctrlKey and event.shiftKey))
			RoomHistoryManager.clear rid

	isMessageTooLong: (input) ->
		input?.value.length > this.messageMaxSize
