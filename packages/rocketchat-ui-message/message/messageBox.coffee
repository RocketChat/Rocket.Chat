isSubscribed = (_id) ->
	return ChatSubscription.find({ rid: _id }).count() > 0

Template.messageBox.helpers
	roomName: ->
		roomData = Session.get('roomData' + this._id)
		return '' unless roomData

		if roomData.t is 'd'
			return ChatSubscription.findOne({ rid: this._id }, { fields: { name: 1 } })?.name
		else
			return roomData.name
	showMarkdown: ->
		return RocketChat.Markdown
	showFormattingTips: ->
		return RocketChat.settings.get('Message_ShowFormattingTips') and (RocketChat.Markdown or RocketChat.Highlight)
	canJoin: ->
		return !! ChatRoom.findOne { _id: @_id, t: 'c' }
	subscribed: ->
		return isSubscribed(this._id)
	getPopupConfig: ->
		template = Template.instance()
		return {
			getInput: ->
				return template.find('.input-message')
		}
	canRecordAudio: ->
		wavRegex = /audio\/wav|audio\/\*/i
		wavEnabled = !RocketChat.settings.get("FileUpload_MediaTypeWhiteList") || RocketChat.settings.get("FileUpload_MediaTypeWhiteList").match(wavRegex)
		return RocketChat.settings.get('Message_AudioRecorderEnabled') and (navigator.getUserMedia? or navigator.webkitGetUserMedia?) and wavEnabled and RocketChat.settings.get('FileUpload_Enabled')
	usersTyping: ->
		users = MsgTyping.get @_id
		if users.length is 0
			return
		if users.length is 1
			return {
				multi: false
				selfTyping: MsgTyping.selfTyping.get()
				users: users[0]
			}
		# usernames = _.map messages, (message) -> return message.u.username
		last = users.pop()
		if users.length > 4
			last = t('others')
		# else
		usernames = users.join(', ')
		usernames = [usernames, last]
		return {
			multi: true
			selfTyping: MsgTyping.selfTyping.get()
			users: usernames.join " #{t 'and'} "
		}
	fileUploadAllowedMediaTypes: ->
		return RocketChat.settings.get('FileUpload_MediaTypeWhiteList')


Template.messageBox.events
	'click .join': (event) ->
		event.stopPropagation()
		event.preventDefault()
		Meteor.call 'joinRoom', @_id

	'focus .input-message': (event) ->
		KonchatNotification.removeRoomNotification @_id

	'keyup .input-message': (event) ->
		chatMessages[Session.get('openedRoom')].keyup(@_id, event, Template.instance())

	'paste .input-message': (e) ->
		if not e.originalEvent.clipboardData?
			return

		items = e.originalEvent.clipboardData.items
		files = []
		for item in items
			if item.kind is 'file' and item.type.indexOf('image/') isnt -1
				e.preventDefault()
				files.push
					file: item.getAsFile()
					name: 'Clipboard'

		if files.length > 0
			fileUpload files

	'keydown .input-message': (event) ->
		chatMessages[Session.get('openedRoom')].keydown(@_id, event, Template.instance())

	'click .message-form .icon-paper-plane': (event) ->
		input = $(event.currentTarget).siblings("textarea")
		chatMessages[Session.get('openedRoom')].send(this._id, input.get(0))
		event.preventDefault()
		event.stopPropagation()
		input.focus()
		input.get(0).updateAutogrow()

	"click .editing-commands-cancel > a": (e) ->
		chatMessages[Session.get('openedRoom')].clearEditing()

	"click .editing-commands-save > a": (e) ->
		chatMessages[Session.get('openedRoom')].send(@_id, chatMessages.input)



	'change .message-form input[type=file]': (event, template) ->
		e = event.originalEvent or event
		files = e.target.files
		if not files or files.length is 0
			files = e.dataTransfer?.files or []

		filesToUpload = []
		for file in files
			filesToUpload.push
				file: file
				name: file.name

		fileUpload filesToUpload

	'click .message-form .mic': (e, t) ->
		AudioRecorder.start ->
			t.$('.stop-mic').removeClass('hidden')
			t.$('.mic').addClass('hidden')

	'click .message-form .stop-mic': (e, t) ->
		AudioRecorder.stop (blob) ->
			fileUpload [{
				file: blob
				type: 'audio'
				name: 'Audio record'
			}]

		t.$('.stop-mic').addClass('hidden')
		t.$('.mic').removeClass('hidden')

Template.messageBox.onRendered ->
	# unless window.chatMessages[Session.get('openedRoom')]
	# 	window.chatMessages[Session.get('openedRoom')] = new ChatMessages
	# this.chatMessages.init(this.firstNode)
