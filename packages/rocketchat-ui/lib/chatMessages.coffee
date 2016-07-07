class @ChatMessages
	init: (node) ->
		this.editing = {}
		this.records  = {}
		this.messageMaxSize = RocketChat.settings.get('Message_MaxAllowedSize')
		this.wrapper = $(node).find(".wrapper")
		this.input = $(node).find(".input-message").get(0)
		this.$input = $(this.input)
		this.hasValue = new ReactiveVar false
		this.bindEvents()
		return

	resize: ->
		dif = 60 + $(".messages-container").find("footer").outerHeight()
		$(".messages-box").css
			height: "calc(100% - #{dif}px)"

	getEditingIndex: (element) ->
		msgs = this.wrapper.get(0).querySelectorAll(".own:not(.system)")
		index = 0
		for msg in msgs
			if msg is element
				return index
			index++
		return -1

	recordInputAsDraft: () ->
		id = this.editing.id

		message = this.getMessageById id
		record = this.records[id] || {}
		draft = this.input.value

		if(draft is message.msg)
			this.clearCurrentDraft()
		else
			record.draft = draft
			this.records[id] = record

	getMessageDraft: (id) ->
		return this.records[id]

	clearMessageDraft: (id) ->
		delete this.records[id]

	clearCurrentDraft: () ->
		this.clearMessageDraft this.editing.id

	resetToDraft: (id) ->
		message = this.getMessageById id

		old_value = this.input.value
		this.input.value = message.msg

		return old_value isnt message.msg

	getMessageById: (id) ->
		return ChatMessage.findOne(id)

	toPrevMessage: ->
		index = this.editing.index
		this.editByIndex if index? then index - 1 else undefined

	toNextMessage: ->
		index = this.editing.index
		this.clearEditing() unless this.editByIndex index + 1

	editByIndex: (index) ->
		return false if not this.editing.element and index?

		msgs = this.wrapper.get(0).querySelectorAll(".own:not(.system)")
		index = msgs.length - 1 if not index?

		return false unless msgs[index]

		element = msgs[index]
		this.edit element, index

		return true

	edit: (element, index) ->
		index = this.getEditingIndex(element) if not index?

		message = this.getMessageById element.getAttribute("id")

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

		msg = this.getMessageDraft(message._id)?.draft
		msg = message.msg unless msg?

		editingNext = this.editing.index < index

		old_input = this.input.value

		this.clearEditing()

		this.hasValue.set true
		this.editing.element = element
		this.editing.index = index
		this.editing.id = message._id
		element.classList.add("editing")
		this.input.classList.add("editing")
		this.$input.closest('.message-form').addClass('editing')

		this.input.focus()

		this.input.value = msg

		cursor_pos = if editingNext then 0 else -1
		this.$input.setCursorPosition(cursor_pos)

	clearEditing: ->
		if this.editing.element
			this.recordInputAsDraft()

			this.editing.element.classList.remove("editing")
			this.input.classList.remove("editing")
			this.$input.closest('.message-form').removeClass('editing')
			delete this.editing.id
			delete this.editing.element
			delete this.editing.index

			this.input.value = this.editing.saved or ""
			cursor_pos = this.editing.savedCursor ? -1
			this.$input.setCursorPosition(cursor_pos)

			this.hasValue.set this.input.value isnt ''
		else
			this.editing.saved = this.input.value
			this.editing.savedCursor = this.input.selectionEnd

	###*
	# * @param {string} rim room ID
	# * @param {Element} input DOM element
	# * @param {function?} done callback
	###
	send: (rid, input, done = ->) ->
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

				this.clearCurrentDraft()
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
					if match?
						if RocketChat.slashCommands.commands[match[1]]
							commandOptions = RocketChat.slashCommands.commands[match[1]]
							command = match[1]
							param = match[2]
							if commandOptions.clientOnly
								commandOptions.callback(command, param, msgObject)
							else
								Meteor.call 'slashCommand', {cmd: command, params: param, msg: msgObject }
							return
						invalidCommandMsg =
							_id: Random.id()
							rid: rid
							ts: new Date
							msg: TAPi18n.__('No_such_command', { command: match[1] })
							u:
								username: "rocketbot"
							private: true
						ChatMessage.upsert { _id: invalidCommandMsg._id }, invalidCommandMsg
						return

				Meteor.call 'sendMessage', msgObject
				done()

		# If edited message was emptied we ask for deletion
		else if this.editing.element
			message = this.getMessageById this.editing.id

			# Restore original message in textbox in case delete is canceled
			this.resetToDraft this.editing.id

			this.confirmDeleteMsg message, done

	confirmDeleteMsg: (message, done = ->) ->
		return if RocketChat.MessageTypes.isSystemMessage(message)
		swal {
			title: t('Are_you_sure')
			text: t('You_will_not_be_able_to_recover')
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: t('Yes_delete_it')
			cancelButtonText: t('Cancel')
			closeOnConfirm: false
			html: false
		}, =>
			swal
				title: t('Deleted')
				text: t('Your_entry_has_been_deleted')
				type: 'success'
				timer: 1000
				showConfirmButton: false

			if this.editing.id is message._id
				this.clearEditing message
			this.deleteMsg message

			this.$input.focus()
			done()

		# In order to avoid issue "[Callback not called when still animating](https://github.com/t4t5/sweetalert/issues/528)"
		$('.sweet-alert').addClass 'visible'

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
				return handleError(error)

	pinMsg: (message) ->
		message.pinned = true
		Meteor.call 'pinMessage', message, (error, result) ->
			if error
				return handleError(error)

	unpinMsg: (message) ->
		message.pinned = false
		Meteor.call 'unpinMessage', message, (error, result) ->
			if error
				return handleError(error)

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
		$input = $(input)
		k = event.which
		this.resize(input)
		if k is 13 and not event.shiftKey # Enter without shift
			event.preventDefault()
			event.stopPropagation()
			this.send(rid, input)
			return

		if k is 9 # Tab
			event.preventDefault()
			event.stopPropagation()
			@tryCompletion input

		if k is 27 # Escape
			if this.editing.index?
				record = this.getMessageDraft(this.editing.id)

				# If resetting did nothing then edited message is same as original
				unless this.resetToDraft this.editing.id
					this.clearCurrentDraft()
					this.clearEditing()

				event.preventDefault()
				event.stopPropagation()
				return
		else if k is 38 or k is 40 # Arrow Up or down
			return true if event.shiftKey

			cursor_pos = input.selectionEnd

			if k is 38 # Arrow Up
				if cursor_pos is 0
					this.toPrevMessage()
				else if not event.altKey
					return true

				this.$input.setCursorPosition(0) if event.altKey

			else # Arrow Down
				if cursor_pos is input.value.length
					this.toNextMessage()
				else if not event.altKey
					return true

				this.$input.setCursorPosition(-1) if event.altKey

			return false

		# ctrl (command) + shift + k -> clear room messages
		else if k is 75 and ((navigator?.platform?.indexOf('Mac') isnt -1 and event.metaKey and event.shiftKey) or (navigator?.platform?.indexOf('Mac') is -1 and event.ctrlKey and event.shiftKey))
			RoomHistoryManager.clear rid

	isMessageTooLong: (message) ->
		message?.length > this.messageMaxSize

	isEmpty: ->
		return !this.hasValue.get()
