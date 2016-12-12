
Template.message.helpers
	isBot: ->
		return 'bot' if this.bot?
	roleTags: ->
		unless RocketChat.settings.get('UI_DisplayRoles')
			return []
		roles = _.union(UserRoles.findOne(this.u?._id)?.roles, RoomRoles.findOne({'u._id': this.u?._id, rid: this.rid })?.roles)
		return RocketChat.models.Roles.find({ _id: { $in: roles }, description: { $exists: 1, $ne: '' } }, { fields: { description: 1 } })
	userrealname : ->
		user = Meteor.users.findOne({username:this.u?.username})
		return user?.name
	avatar_img : ->
		user = Meteor.users.findOne({username:this.u?.username})
		return user?.photo
	isGroupable: ->
		return 'false' if this.groupable is false
	isSequential: ->
		return 'sequential' if this.groupable isnt false
	avatarFromUsername: ->
		if this.avatar? and this.avatar[0] is '@'
			return this.avatar.replace(/^@/, '')
	getEmoji: (emoji) ->
		return renderEmoji emoji
	own: ->
		return 'own' if this.u?._id is Meteor.userId()
	timestamp: ->
		return +this.ts
	chatops: ->
		return 'chatops-message' if this.u?.username is RocketChat.settings.get('Chatops_Username')
	time: ->
		return moment(this.ts).format(RocketChat.settings.get('Message_TimeFormat'))
	date: ->
		return moment(this.ts).format(RocketChat.settings.get('Message_DateFormat'))
	isTemp: ->
		if @temp is true
			return 'temp'
	body: ->
		return Template.instance().body
	system: ->
		if RocketChat.MessageTypes.isSystemMessage(this)
			return 'system'
	edited: ->
		return Template.instance().wasEdited

	editTime: ->
		if Template.instance().wasEdited
			return moment(@editedAt).format(RocketChat.settings.get('Message_DateFormat') + ' ' + RocketChat.settings.get('Message_TimeFormat'))
	editedBy: ->
		return "" unless Template.instance().wasEdited
		# try to return the username of the editor,
		# otherwise a special "?" character that will be
		# rendered as a special avatar
		return @editedBy?.username or "?"
	canEdit: ->
		hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', this.rid)
		isEditAllowed = RocketChat.settings.get 'Message_AllowEditing'
		editOwn = this.u?._id is Meteor.userId()

		return unless hasPermission or (isEditAllowed and editOwn)

		blockEditInMinutes = RocketChat.settings.get 'Message_AllowEditing_BlockEditInMinutes'
		if blockEditInMinutes? and blockEditInMinutes isnt 0
			msgTs = moment(this.ts) if this.ts?
			currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
			return currentTsDiff < blockEditInMinutes
		else
			return true
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
		return RocketChat.roomTypes.verifyShowJoinLink @_id
	joinCodeRequired: ->
		return Session.get('roomData' + this._id)?.joinCodeRequired
	subscribed: ->
		return RocketChat.roomTypes.verifyCanSendMessage @_id
	getPopupConfig: ->
		template = Template.instance()
		return {
			getInput: ->
				return template.find('.input-message')
		}
	usersTyping: ->
		room_typing = MsgTyping.get @_id
		if room_typing.input_text == ""
			return
		users = _.keys(room_typing.users) or []
		if (Meteor.user() && Meteor.user()?.roles.indexOf("livechat-manager") > -1)
			input_text = " : " + room_typing.input_text
			input_text = input_text + " ..."
		else
			input_text = " is Typing"

		if users.length is 0
			return
		if users.length is 1
			return {
				multi: false
				selfTyping: MsgTyping.selfTyping.get()
				users: users[0]
				typing_text: input_text
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
			typing_text: input_text
		}

	fileUploadAllowedMediaTypes: ->
		return RocketChat.settings.get('FileUpload_MediaTypeWhiteList')

	showMic: ->
		return Template.instance().showMicButton.get()

	showVRec: ->
		return Template.instance().showVideoRec.get()

	showSend: ->
		if not Template.instance().isMessageFieldEmpty.get()
			return 'show-send'

	showLocation: ->
		return RocketChat.Geolocation.get() isnt false

	notSubscribedTpl: ->
		return RocketChat.roomTypes.getNotSubscribedTpl @_id

	showSandstorm: ->
		return Meteor.settings.public.sandstorm


Template.messageBox.events
	'click .join': (event) ->
		event.stopPropagation()
		event.preventDefault()
		Meteor.call 'joinRoom', @_id, Template.instance().$('[name=joinCode]').val(), (err) ->
			if err?
				toastr.error t(err.reason)

			if RocketChat.authz.hasAllPermission('preview-c-room') is false and RoomHistoryManager.getRoom(@_id).loaded is 0
				RoomManager.getOpenedRoomByRid(@_id).streamActive = false
				RoomManager.getOpenedRoomByRid(@_id).ready = false
				RoomHistoryManager.getRoom(@_id).loaded = undefined
				RoomManager.computation.invalidate()

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

	'paste .input-message': (e, instance) ->
		Meteor.setTimeout ->
			input = instance.find('.input-message')
			input.updateAutogrow?()
		, 50

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

	'input .input-message': (event) ->
		chatMessages[@_id].valueChanged(@_id, event, Template.instance())

	'propertychange .input-message': (event) ->
		if event.originalEvent.propertyName is 'value'
			chatMessages[@_id].valueChanged(@_id, event, Template.instance())

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

	'click .message-form .icon-location.location': (event, instance) ->
		roomId = @_id

		position = RocketChat.Geolocation.get()

		latitude = position.coords.latitude
		longitude = position.coords.longitude

		text = """
			<div class="location-preview">
				<img style="height: 250px; width: 250px;" src="https://maps.googleapis.com/maps/api/staticmap?zoom=14&size=250x250&markers=color:gray%7Clabel:%7C#{latitude},#{longitude}&key=#{RocketChat.settings.get('MapView_GMapsAPIKey')}" />
			</div>
		"""

		swal
			title: t('Share_Location_Title')
			text: text
			showCancelButton: true
			closeOnConfirm: true
			closeOnCancel: true
			html: true
		, (isConfirm) ->
			if isConfirm isnt true
				return

			Meteor.call "sendMessage",
				_id: Random.id()
				rid: roomId
				msg: ""
				location:
					type: 'Point'
					coordinates: [ longitude, latitude ]


	'click .message-form .mic': (e, t) ->
		AudioRecorder.start ->
			t.$('.stop-mic').removeClass('hidden')
			t.$('.mic').addClass('hidden')

	'click .message-form .video-button': (e, t) ->
		if VRecDialog.opened
			VRecDialog.close()
		else
			VRecDialog.open(e.currentTarget)

	'click .message-form .stop-mic': (e, t) ->
		AudioRecorder.stop (blob) ->
			fileUpload [{
				file: blob
				type: 'audio'
				name: TAPi18n.__('Audio record') + '.wav'
			}]

		t.$('.stop-mic').addClass('hidden')
		t.$('.mic').removeClass('hidden')

	'click .sandstorm-offer': (e, t) ->
		roomId = @_id
		RocketChat.Sandstorm.request "uiView", (err, data) =>
			if err or !data.token
				console.error err
				return
			Meteor.call "sandstormClaimRequest", data.token, data.descriptor, (err, viewInfo) =>
				if err
					console.error err
					return

				Meteor.call "sendMessage", {
					_id: Random.id()
					rid: roomId
					msg: ""
					urls: [{ url: "grain://sandstorm", sandstormViewInfo: viewInfo }]
				}

Template.messageBox.onCreated ->
	@isMessageFieldEmpty = new ReactiveVar true
	@showMicButton = new ReactiveVar false
	@showVideoRec = new ReactiveVar false

	@autorun =>
		videoRegex = /video\/webm|video\/\*/i
		videoEnabled = !RocketChat.settings.get("FileUpload_MediaTypeWhiteList") || RocketChat.settings.get("FileUpload_MediaTypeWhiteList").match(videoRegex)
		if RocketChat.settings.get('Message_VideoRecorderEnabled') and (navigator.getUserMedia? or navigator.webkitGetUserMedia?) and videoEnabled and RocketChat.settings.get('FileUpload_Enabled')
			@showVideoRec.set true
		else
			@showVideoRec.set false

	hideReactions: ->
		return 'hidden' if _.isEmpty(@reactions)


	actionLinks: ->
		# remove 'method_id' and 'params' properties
		return _.map(@actionLinks, (actionLink, key) -> _.extend({ id: key }, _.omit(actionLink, 'method_id', 'params')))

	hideActionLinks: ->
		return 'hidden' if _.isEmpty(@actionLinks)
		wavRegex = /audio\/wav|audio\/\*/i
		wavEnabled = !RocketChat.settings.get("FileUpload_MediaTypeWhiteList") || RocketChat.settings.get("FileUpload_MediaTypeWhiteList").match(wavRegex)
		if RocketChat.settings.get('Message_AudioRecorderEnabled') and (navigator.getUserMedia? or navigator.webkitGetUserMedia?) and wavEnabled and RocketChat.settings.get('FileUpload_Enabled')
			@showMicButton.set true
		else
			@showMicButton.set false


	hideCog: ->
		subscription = RocketChat.models.Subscriptions.findOne({ rid: this.rid });
		return 'hidden' if not subscription?
Meteor.startup ->
	RocketChat.Geolocation = new ReactiveVar false

	Tracker.autorun ->
		if RocketChat.settings.get('MapView_Enabled') is true and RocketChat.settings.get('MapView_GMapsAPIKey')?.length and navigator.geolocation?.getCurrentPosition?
			success = (position) =>
				RocketChat.Geolocation.set position

			error = (error) =>
				console.log 'Error getting your geolocation', error
				RocketChat.Geolocation.set false

			options =
				enableHighAccuracy: true
				maximumAge: 0
				timeout: 10000

			navigator.geolocation.watchPosition success, error
		else
			RocketChat.Geolocation.set false
