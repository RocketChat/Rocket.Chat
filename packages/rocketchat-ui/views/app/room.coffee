isSubscribed = (_id) ->
	return ChatSubscription.find({ rid: _id }).count() > 0

favoritesEnabled = ->
	return !RocketChat.settings.get 'Disable_Favorite_Rooms'


# @TODO bug com o botão para "rolar até o fim" (novas mensagens) quando há uma mensagem com texto que gere rolagem horizontal
Template.room.helpers
	# showFormattingTips: ->
	# 	return RocketChat.settings.get('Message_ShowFormattingTips') and (RocketChat.Markdown or RocketChat.Highlight)
	# showMarkdown: ->
	# 	return RocketChat.Markdown
	# showHighlight: ->
	# 	return RocketChat.Highlight
	favorite: ->
		sub = ChatSubscription.findOne { rid: this._id }, { fields: { f: 1 } }
		return 'icon-star favorite-room' if sub?.f? and sub.f and favoritesEnabled
		return 'icon-star-empty'

	favoriteLabel: ->
		sub = ChatSubscription.findOne { rid: this._id }, { fields: { f: 1 } }
		return "Unfavorite" if sub?.f? and sub.f and favoritesEnabled
		return "Favorite"

	subscribed: ->
		return isSubscribed(this._id)

	messagesHistory: ->
		return ChatMessage.find { rid: this._id, t: { '$ne': 't' }  }, { sort: { ts: 1 } }

	hasMore: ->
		return RoomHistoryManager.hasMore this._id

	hasMoreNext: ->
		return RoomHistoryManager.hasMoreNext this._id

	isLoading: ->
		return RoomHistoryManager.isLoading this._id

	windowId: ->
		return "chat-window-#{this._id}"

	uploading: ->
		return Session.get 'uploading'

	# usersTyping: ->
	# 	users = MsgTyping.get @_id
	# 	if users.length is 0
	# 		return
	# 	if users.length is 1
	# 		return {
	# 			multi: false
	# 			selfTyping: MsgTyping.selfTyping.get()
	# 			users: users[0]
	# 		}

	# 	# usernames = _.map messages, (message) -> return message.u.username

	# 	last = users.pop()
	# 	if users.length > 4
	# 		last = t('others')
	# 	# else
	# 	usernames = users.join(', ')
	# 	usernames = [usernames, last]
	# 	return {
	# 		multi: true
	# 		selfTyping: MsgTyping.selfTyping.get()
	# 		users: usernames.join " #{t 'and'} "
	# 	}

	roomName: ->
		roomData = Session.get('roomData' + this._id)
		return '' unless roomData

		if roomData.t is 'd'
			return ChatSubscription.findOne({ rid: this._id }, { fields: { name: 1 } })?.name
		else
			return roomData.name

	roomTopic: ->
		roomData = Session.get('roomData' + this._id)
		return '' unless roomData
		return roomData.topic

	roomIcon: ->
		roomData = Session.get('roomData' + this._id)
		return '' unless roomData?.t

		switch roomData.t
			when 'd' then return 'icon-at'
			when 'c' then return 'icon-hash'
			when 'p' then return 'icon-lock'

	userStatus: ->
		roomData = Session.get('roomData' + this._id)

		return {} unless roomData

		if roomData.t is 'd'
			username = _.without roomData.usernames, Meteor.user().username
			return Session.get('user_' + username + '_status') || 'offline'

		else
			return 'offline'

	isChannel: ->
		roomData = Session.get('roomData' + this._id)
		return '' unless roomData
		return roomData.t is 'c'

	canDirectMessage: ->
		return Meteor.user()?.username isnt this.username

	flexOpened: ->
		return 'opened' if RocketChat.TabBar.isFlexOpen()

	arrowPosition: ->
		return 'left' unless RocketChat.TabBar.isFlexOpen()

	phoneNumber: ->
		return '' unless this.phoneNumber
		if this.phoneNumber.length > 10
			return "(#{this.phoneNumber.substr(0,2)}) #{this.phoneNumber.substr(2,5)}-#{this.phoneNumber.substr(7)}"
		else
			return "(#{this.phoneNumber.substr(0,2)}) #{this.phoneNumber.substr(2,4)}-#{this.phoneNumber.substr(6)}"

	userActiveByUsername: (username) ->
		status = Session.get 'user_' + username + '_status'
		if status in ['online', 'away', 'busy']
			return {username: username, status: status}
		return

	getPopupConfig: ->
		template = Template.instance()
		return {
			getInput: ->
				return template.find('.input-message')
		}

	maxMessageLength: ->
		return RocketChat.settings.get('Message_MaxAllowedSize')

	utc: ->
		if @utcOffset?
			return "UTC #{@utcOffset}"

	phoneNumber: ->
		return '' unless @phoneNumber
		if @phoneNumber.length > 10
			return "(#{@phoneNumber.substr(0,2)}) #{@phoneNumber.substr(2,5)}-#{@phoneNumber.substr(7)}"
		else
			return "(#{@phoneNumber.substr(0,2)}) #{@phoneNumber.substr(2,4)}-#{@phoneNumber.substr(6)}"

	lastLogin: ->
		if @lastLogin
			return moment(@lastLogin).format('LLL')

	canJoin: ->
		return !! ChatRoom.findOne { _id: @_id, t: 'c' }

	canRecordAudio: ->
		wavRegex = /audio\/wav|audio\/\*/i
		wavEnabled = !RocketChat.settings.get("FileUpload_MediaTypeWhiteList") || RocketChat.settings.get("FileUpload_MediaTypeWhiteList").match(wavRegex)
		return RocketChat.settings.get('Message_AudioRecorderEnabled') and (navigator.getUserMedia? or navigator.webkitGetUserMedia?) and wavEnabled and RocketChat.settings.get('FileUpload_Enabled')

	unreadSince: ->
		room = ChatRoom.findOne(this._id, { reactive: false })
		if room?
			return RoomManager.openedRooms[room.t + room.name]?.unreadSince?.get()

	unreadCount: ->
		return RoomHistoryManager.getRoom(@_id).unreadNotLoaded.get() + Template.instance().unreadCount.get()

	formatUnreadSince: ->
		room = ChatRoom.findOne(this._id, { reactive: false })
		room = RoomManager.openedRooms[room?.t + room?.name]
		date = room?.unreadSince.get()
		if not date? then return

		return moment(date).calendar(null, {sameDay: 'LT'})

	flexTemplate: ->
		return RocketChat.TabBar.getTemplate()

	flexData: ->
		return _.extend { rid: this._id }, RocketChat.TabBar.getData()

	adminClass: ->
		return 'admin' if RocketChat.authz.hasRole(Meteor.userId(), 'admin')

	showToggleFavorite: ->
		return true if isSubscribed(this._id) and favoritesEnabled()

	compactView: ->
		return 'compact' if Meteor.user()?.settings?.preferences?.compactView

	selectable: ->
		return Template.instance().selectable.get()

Template.room.events
	"click, touchend": (e, t) ->
		Meteor.setTimeout ->
			t.sendToBottomIfNecessaryDebounced()
		, 100

	"touchstart .message": (e, t) ->
		message = this._arguments[1]
		doLongTouch = ->
			mobileMessageMenu.show(message, t)

		t.touchtime = Meteor.setTimeout doLongTouch, 500

	"touchend .message": (e, t) ->
		Meteor.clearTimeout t.touchtime

	"touchmove .message": (e, t) ->
		Meteor.clearTimeout t.touchtime

	"touchcancel .message": (e, t) ->
		Meteor.clearTimeout t.touchtime

	"click .upload-progress-text > a": (e) ->
		e.preventDefault();
		Session.set "uploading-cancel-#{this.id}", true

	"click .unread-bar > a.mark-read": ->
		readMessage.readNow(true)

	"click .unread-bar > a.jump-to": ->
		message = RoomHistoryManager.getRoom(@_id)?.firstUnread.get()
		if message?
			RoomHistoryManager.getSurroundingMessages(message, 50)
		else
			subscription = ChatSubscription.findOne({ rid: @_id })
			message = ChatMessage.find({ rid: @_id, ts: { $gt: subscription?.ls } }, { sort: { ts: 1 }, limit: 1 }).fetch()[0]
			RoomHistoryManager.getSurroundingMessages(message, 50)

	"click .flex-tab .more": (event, t) ->
		if RocketChat.TabBar.isFlexOpen()
			Session.set('rtcLayoutmode', 0)
			RocketChat.TabBar.closeFlex()
			t.searchResult.set undefined
		else
			RocketChat.TabBar.openFlex()


	"click .flex-tab  .video-remote" : (e) ->
		if RocketChat.TabBar.isFlexOpen()
			if (!Session.get('rtcLayoutmode'))
				Session.set('rtcLayoutmode', 1)
			else
				t = Session.get('rtcLayoutmode')
				t = (t + 1) % 4
				console.log  'setting rtcLayoutmode to ' + t  if window.rocketDebug
				Session.set('rtcLayoutmode', t)

	"click .flex-tab  .video-self" : (e) ->
		if (Session.get('rtcLayoutmode') == 3)
			console.log 'video-self clicked in layout3' if window.rocketDebug
			i = document.getElementById("fullscreendiv")
			if i.requestFullscreen
				i.requestFullscreen()
			else
				if i.webkitRequestFullscreen
					i.webkitRequestFullscreen()
				else
					if i.mozRequestFullScreen
						i.mozRequestFullScreen()
					else
						if i.msRequestFullscreen
							i.msRequestFullscreen()

	'click .toggle-favorite': (event) ->
		event.stopPropagation()
		event.preventDefault()
		Meteor.call 'toggleFavorite', @_id, !$('i', event.currentTarget).hasClass('favorite-room')

	'click .edit-room-title': (event) ->
		event.preventDefault()
		Session.set('editRoomTitle', true)
		$(".fixed-title").addClass "visible"
		Meteor.setTimeout ->
			$('#room-title-field').focus().select()
		, 10

	"click .flex-tab .user-image > a" : (e) ->
		RocketChat.TabBar.openFlex()
		Session.set('showUserInfo', @username)

	'click .user-card-message': (e) ->
		roomData = Session.get('roomData' + this._arguments[1].rid)
		if roomData.t in ['c', 'p']
			# Session.set('flexOpened', true)
			Session.set('showUserInfo', $(e.currentTarget).data('username'))
		# else
			# Session.set('flexOpened', true)
		RocketChat.TabBar.setTemplate 'membersList'

	'scroll .wrapper': _.throttle (e, instance) ->
		if RoomHistoryManager.isLoading(@_id) is false and (RoomHistoryManager.hasMore(@_id) is true or RoomHistoryManager.hasMoreNext(@_id) is true)
			if RoomHistoryManager.hasMore(@_id) is true and e.target.scrollTop is 0
				RoomHistoryManager.getMore(@_id)
			else if RoomHistoryManager.hasMoreNext(@_id) is true and e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight
				RoomHistoryManager.getMoreNext(@_id)
	, 200

	'click .load-more > a': ->
		RoomHistoryManager.getMore(@_id)

	'click .new-message': (e) ->
		Template.instance().atBottom = true
		Template.instance().find('.input-message').focus()

	'click .message-cog': (e) ->
		message = @_arguments[1]
		$('.message-dropdown:visible').hide()

		dropDown = $(".messages-box \##{message._id} .message-dropdown")

		if dropDown.length is 0
			actions = RocketChat.MessageAction.getButtons message

			el = Blaze.toHTMLWithData Template.messageDropdown,
				actions: actions

			$(".messages-box \##{message._id} .message-cog-container").append el

			dropDown = $(".messages-box \##{message._id} .message-dropdown")

		dropDown.show()

	'click .add-reaction': (event) ->
		event.preventDefault();
		event.stopPropagation();
		EmojiPicker.open(event.currentTarget, $('.input-message'));

	'mouseenter .reactions > li:not(.add-reaction)': (event, instance) ->
		event.stopPropagation();
		RocketChat.tooltip.showElement(event.currentTarget, instance.find('.people'))

	'mouseleave .reactions > li:not(.add-reaction)': (event, instance) ->
		event.stopPropagation();
		RocketChat.tooltip.hide()

	'click .message-dropdown .message-action': (e, t) ->
		e.preventDefault()
		e.stopPropagation()
		el = $(e.currentTarget)

		button = RocketChat.MessageAction.getButtonById el.data('id')
		if button?.action?
			button.action.call @, e, t

	'click .message-dropdown-close': ->
		$('.message-dropdown:visible').hide()

	"click .mention-link": (e) ->
		channel = $(e.currentTarget).data('channel')
		if channel?
			FlowRouter.go 'channel', {name: channel}
			return

		RocketChat.TabBar.setTemplate 'membersList'
		Session.set('showUserInfo', $(e.currentTarget).data('username'))
		RocketChat.TabBar.openFlex()

	'click .image-to-download': (event) ->
		ChatMessage.update {_id: this._arguments[1]._id, 'urls.url': $(event.currentTarget).data('url')}, {$set: {'urls.$.downloadImages': true}}
		ChatMessage.update {_id: this._arguments[1]._id, 'attachments.image_url': $(event.currentTarget).data('url')}, {$set: {'attachments.$.downloadImages': true}}

	'dragenter .dropzone': (e) ->
		e.currentTarget.classList.add 'over'

	'dragleave .dropzone-overlay': (e) ->
		e.currentTarget.parentNode.classList.remove 'over'

	'dragover .dropzone-overlay': (e) ->
		e = e.originalEvent or e
		if e.dataTransfer.effectAllowed in ['move', 'linkMove']
			e.dataTransfer.dropEffect = 'move'
		else
			e.dataTransfer.dropEffect = 'copy'

	'dropped .dropzone-overlay': (event) ->
		event.currentTarget.parentNode.classList.remove 'over'

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

	'click .deactivate': ->
		username = Session.get('showUserInfo')
		user = Meteor.users.findOne { username: String(username) }
		Meteor.call 'setUserActiveStatus', user?._id, false, (error, result) ->
			if result
				toastr.success t('User_has_been_deactivated')
			if error
				toastr.error error.reason

	'click .activate': ->
		username = Session.get('showUserInfo')
		user = Meteor.users.findOne { username: String(username) }
		Meteor.call 'setUserActiveStatus', user?._id, true, (error, result) ->
			if result
				toastr.success t('User_has_been_activated')
			if error
				toastr.error error.reason

	'load img': (e, template) ->
		template.sendToBottomIfNecessary?()

	'click .jump-recent .jump-link': (e, template) ->
		e.preventDefault()
		template.atBottom = true
		RoomHistoryManager.clear(template?.data?._id)

	'click .message': (e, template) ->
		if template.selectable.get()
			document.selection?.empty() or window.getSelection?().removeAllRanges()
			data = Blaze.getData(e.currentTarget)
			_id = data?._arguments?[1]?._id

			if !template.selectablePointer
				template.selectablePointer = _id

			if !e.shiftKey
				template.selectedMessages = template.getSelectedMessages()
				template.selectedRange = []
				template.selectablePointer = _id

			template.selectMessages _id

			selectedMessages = $('.messages-box .message.selected').map((i, message) -> message.id)
			removeClass = _.difference selectedMessages, template.getSelectedMessages()
			addClass = _.difference template.getSelectedMessages(), selectedMessages
			for message in removeClass
				$(".messages-box ##{message}").removeClass('selected')
			for message in addClass
				$(".messages-box ##{message}").addClass('selected')


Template.room.onCreated ->
	# this.scrollOnBottom = true
	# this.typing = new msgTyping this.data._id
	this.showUsersOffline = new ReactiveVar false
	this.atBottom = true
	this.unreadCount = new ReactiveVar 0

	this.selectable = new ReactiveVar false
	this.selectedMessages = []
	this.selectedRange = []
	this.selectablePointer = null

	this.resetSelection = (enabled) =>
		this.selectable.set(enabled)
		$('.messages-box .message.selected').removeClass 'selected'
		this.selectedMessages = []
		this.selectedRange = []
		this.selectablePointer = null

	this.selectMessages = (to) =>
		if this.selectablePointer is to and this.selectedRange.length > 0
			this.selectedRange = []
		else
			message1 = ChatMessage.findOne this.selectablePointer
			message2 = ChatMessage.findOne to

			minTs = _.min([message1.ts, message2.ts])
			maxTs = _.max([message1.ts, message2.ts])

			this.selectedRange = _.pluck(ChatMessage.find({ rid: message1.rid, ts: { $gte: minTs, $lte: maxTs } }).fetch(), '_id')

	this.getSelectedMessages = =>
		messages = this.selectedMessages
		addMessages = false
		for message in this.selectedRange
			if messages.indexOf(message) is -1
				addMessages = true
				break

		if addMessages
			previewMessages = _.compact(_.uniq(this.selectedMessages.concat(this.selectedRange)))
		else
			previewMessages = _.compact(_.difference(this.selectedMessages, this.selectedRange))

		return previewMessages

	@autorun =>
		@subscribe 'fullUserData', Session.get('showUserInfo'), 1

	Meteor.call 'getRoomModeratorsAndOwners', @data._id, (error, results) ->
		if error
			return toastr.error error.reason

		for record in results
			delete record._id
			RoomModeratorsAndOwners.upsert { rid: record.rid, "u._id": record.u._id }, record

Template.room.onDestroyed ->
	window.removeEventListener 'resize', this.onWindowResize

Template.room.onRendered ->
	unless window.chatMessages
		window.chatMessages = {}
	unless window.chatMessages[Session.get('openedRoom')]
		window.chatMessages[Session.get('openedRoom')] = new ChatMessages
	chatMessages[Session.get('openedRoom')].init(this.firstNode)
	# ScrollListener.init()

	wrapper = this.find('.wrapper')
	wrapperUl = this.find('.wrapper > ul')
	newMessage = this.find(".new-message")

	template = this

	containerBars = $('.messages-container > .container-bars')
	containerBarsOffset = containerBars.offset()

	template.isAtBottom = ->
		if wrapper.scrollTop >= wrapper.scrollHeight - wrapper.clientHeight
			newMessage.className = "new-message not"
			return true
		return false

	template.sendToBottom = ->
		wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight
		newMessage.className = "new-message not"

	template.checkIfScrollIsAtBottom = ->
		template.atBottom = template.isAtBottom()
		readMessage.enable()
		readMessage.read()

	template.sendToBottomIfNecessary = ->
		if template.atBottom is true and template.isAtBottom() isnt true
			template.sendToBottom()

	template.sendToBottomIfNecessaryDebounced = _.debounce template.sendToBottomIfNecessary, 10

	template.sendToBottomIfNecessary()

	if not window.MutationObserver?
		wrapperUl.addEventListener 'DOMSubtreeModified', ->
			template.sendToBottomIfNecessaryDebounced()
	else
		observer = new MutationObserver (mutations) ->
			mutations.forEach (mutation) ->
				template.sendToBottomIfNecessaryDebounced()

		observer.observe wrapperUl,
			childList: true
		# observer.disconnect()

	template.onWindowResize = ->
		Meteor.defer ->
			template.sendToBottomIfNecessaryDebounced()

	window.addEventListener 'resize', template.onWindowResize

	wrapper.addEventListener 'mousewheel', ->
		template.atBottom = false
		Meteor.defer ->
			template.checkIfScrollIsAtBottom()

	wrapper.addEventListener 'wheel', ->
		template.atBottom = false
		Meteor.defer ->
			template.checkIfScrollIsAtBottom()

	wrapper.addEventListener 'touchstart', ->
		template.atBottom = false

	wrapper.addEventListener 'touchend', ->
		Meteor.defer ->
			template.checkIfScrollIsAtBottom()
		Meteor.setTimeout ->
			template.checkIfScrollIsAtBottom()
		, 1000
		Meteor.setTimeout ->
			template.checkIfScrollIsAtBottom()
		, 2000

	$('.flex-tab-bar').on 'click', (e, t) ->
		Meteor.setTimeout ->
			template.sendToBottomIfNecessaryDebounced()
		, 100

	updateUnreadCount = _.throttle ->
		firstMessageOnScreen = document.elementFromPoint(containerBarsOffset.left+1, containerBarsOffset.top+containerBars.height()+1)
		if firstMessageOnScreen?.id?
			firstMessage = ChatMessage.findOne firstMessageOnScreen.id
			if firstMessage?
				subscription = ChatSubscription.findOne rid: template.data._id
				template.unreadCount.set ChatMessage.find({rid: template.data._id, ts: {$lt: firstMessage.ts, $gt: subscription?.ls}}).count()
			else
				template.unreadCount.set 0
	, 300

	readMessage.onRead (rid) ->
		if rid is template.data._id
			template.unreadCount.set 0

	wrapper.addEventListener 'scroll', ->
		updateUnreadCount()

	# salva a data da renderização para exibir alertas de novas mensagens
	$.data(this.firstNode, 'renderedAt', new Date)

	webrtc = WebRTC.getInstanceByRoomId template.data._id
	if webrtc?
		Tracker.autorun ->
			if webrtc.remoteItems.get()?.length > 0
				RocketChat.TabBar.setTemplate 'membersList'
				RocketChat.TabBar.openFlex()

			if webrtc.localUrl.get()?
				RocketChat.TabBar.setTemplate 'membersList'
				RocketChat.TabBar.openFlex()
