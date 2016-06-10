isSubscribed = (_id) ->
	return ChatSubscription.find({ rid: _id }).count() > 0

katexSyntax = ->
	if RocketChat.katex.katex_enabled()
		return "$$KaTeX$$"   if RocketChat.katex.dollar_syntax_enabled()
		return "\\[KaTeX\\]" if RocketChat.katex.parenthesis_syntax_enabled()

	return false

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
	showMarkdownCode: ->
		return RocketChat.MarkdownCode
	showKatex: ->
		return RocketChat.katex
	katexSyntax: ->
		return katexSyntax()
	showFormattingTips: ->
		return RocketChat.settings.get('Message_ShowFormattingTips') and (RocketChat.Markdown or RocketChat.MarkdownCode or katexSyntax())
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

	showMic: ->
		if not Template.instance().isMessageFieldEmpty.get()
			return

		if Template.instance().showMicButton.get()
			return 'show-mic'

	showSend: ->
		if not Template.instance().isMessageFieldEmpty.get() or not Template.instance().showMicButton.get()
			return 'show-send'

Template.messageBox.events
	'click .join': (event) ->
		event.stopPropagation()
		event.preventDefault()
		Meteor.call 'joinRoom', @_id

	'focus .input-message': (event) ->
		KonchatNotification.removeRoomNotification @_id

	'click .send-button': (event, instance) ->
		input = instance.find('.input-message')
		chatMessages[@_id].send(@_id, input, =>
			# fixes https://github.com/RocketChat/Rocket.Chat/issues/3037
			# at this point, the input is cleared and ready for autogrow
			input.updateAutogrow()
			instance.isMessageFieldEmpty.set(chatMessages[@_id].isEmpty())
		)
		input.focus()

	'keyup .input-message': (event, instance) ->
		chatMessages[@_id].keyup(@_id, event, instance)
		instance.isMessageFieldEmpty.set(chatMessages[@_id].isEmpty())

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
		chatMessages[@_id].keydown(@_id, event, Template.instance())

	"click .editing-commands-cancel > button": (e) ->
		chatMessages[@_id].clearEditing()

	"click .editing-commands-save > button": (e) ->
		chatMessages[@_id].send(@_id, chatMessages[@_id].input)

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
				name: TAPi18n.__('Audio record') + '.wav'
			}]

		t.$('.stop-mic').addClass('hidden')
		t.$('.mic').removeClass('hidden')

Template.messageBox.onCreated ->
	@isMessageFieldEmpty = new ReactiveVar true
	@showMicButton = new ReactiveVar false

	@autorun =>
		wavRegex = /audio\/wav|audio\/\*/i
		wavEnabled = !RocketChat.settings.get("FileUpload_MediaTypeWhiteList") || RocketChat.settings.get("FileUpload_MediaTypeWhiteList").match(wavRegex)
		if RocketChat.settings.get('Message_AudioRecorderEnabled') and (navigator.getUserMedia? or navigator.webkitGetUserMedia?) and wavEnabled and RocketChat.settings.get('FileUpload_Enabled')
			@showMicButton.set true
		else
			@showMicButton.set false
