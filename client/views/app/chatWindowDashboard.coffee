# @TODO bug com o botão para "rolar até o fim" (novas mensagens) quando há uma mensagem com texto que gere rolagem horizontal
Template.chatWindowDashboard.helpers
	visible: ->
		console.log 'chatWindowDashboard.helpers visible' if window.rocketDebug
		return 'visible' if this._id is Session.get('openedRoom')

	tAddUsers: ->
		console.log 'chatWindowDashboard.helpers tAddUsers' if window.rocketDebug
		return t('Add_users')

	tQuickSearch: ->
		console.log 'chatWindowDashboard.helpers tQuickSearch' if window.rocketDebug
		return t('Quick_Search')

	favorite: ->
		console.log 'chatWindowDashboard.helpers favorite' if window.rocketDebug
		sub = ChatSubscription.findOne { rid: this._id }, { fields: { f: 1 } }
		return 'icon-star favorite-room' if sub?.f? and sub.f
		return 'icon-star-empty'

	subscribed: ->
		console.log 'chatWindowDashboard.helpers subscribed' if window.rocketDebug
		return ChatSubscription.find({ rid: this._id }).count() > 0

	messages: ->
		console.log 'chatWindowDashboard.helpers messages' if window.rocketDebug
		window.lastMessageWindow[this._id] = undefined
		window.lastMessageWindowHistory[this._id] = undefined
		return ChatMessage.find { rid: this._id }, { sort: { ts: 1 } }

	messagesHistory: ->
		console.log 'chatWindowDashboard.helpers messagesHistory' if window.rocketDebug
		return ChatMessageHistory.find { rid: this._id }, { sort: { ts: 1 } }

	hasMore: ->
		console.log 'chatWindowDashboard.helpers hasMore' if window.rocketDebug
		return RoomHistoryManager.hasMore this._id

	isLoading: ->
		console.log 'chatWindowDashboard.helpers isLoading' if window.rocketDebug
		return 'btn-loading' if RoomHistoryManager.isLoading this._id

	windowId: ->
		console.log 'chatWindowDashboard.helpers windowId' if window.rocketDebug
		return "chat-window-#{this._id}"

	roomContainerId: ->
		console.log 'chatWindowDashboard.helpers roomContainerId' if window.rocketDebug
		return "room-container-#{this._id}"

	showTyping: ->
		console.log 'chatWindowDashboard.helpers showTyping' if window.rocketDebug
		return this.t is 't'

	typing: ->
		console.log 'chatWindowDashboard.helpers typing' if window.rocketDebug
		return this.u._id isnt Meteor.userId()

	usersTyping: ->
		console.log 'chatWindowDashboard.helpers usersTyping' if window.rocketDebug
		messages = ChatMessage.find { rid: this._id }, { sort: { ts: 1 } }
		usernames = []
		selfTyping = false
		messages.forEach (message) ->
			if message.t is 't'
				if message.u._id is Meteor.userId()
					selfTyping = true
				else
					username = message.u.username
					if username?
						usernames.push username

		if usernames.length is 0
			return

		if usernames.length is 1
			return {
				multi: false
				selfTyping: selfTyping
				users: usernames[0]
			}

		last = usernames.pop()
		usernames = usernames.join(', ')
		usernames = [usernames, last]
		return {
			multi: true
			selfTyping: selfTyping
			users: usernames.join " #{t 'general.and'} "
		}

	messageInfo: (from) ->
		console.log 'chatWindowDashboard.helpers messageInfo' if window.rocketDebug
		collection = ChatMessage

		if from is 'history'
			collection = ChatMessageHistory

		last = collection.find({ts: {$lt: this.ts}, t: {$exists: false}}, { sort: { ts: -1 }, limit: 1 }).fetch()[0]
		if not last?
			return {
				single: false
				newDay: false
			}

		return {
			single: last.u.username is this.u.username and this.ts - last.ts < 30000
			newDay: moment(last.ts).format('YYYYMMDD') isnt moment(this.ts).format('YYYYMMDD')
		}

	roomName: ->
		console.log 'chatWindowDashboard.helpers roomName' if window.rocketDebug
		roomData = Session.get('roomData' + this._id)
		return '' unless roomData

		if roomData.t is 'd'
			return ChatSubscription.findOne({ rid: this._id }, { fields: { name: 1 } }).name
		else
			return roomData.name

	roomTypeIcon: ->
		console.log 'chatWindowDashboard.helpers roomTypeIcon' if window.rocketDebug
		roomData = Session.get('roomData' + this._id)
		return '' unless roomData
		return 'icon-hash' if roomData.t is 'c'
		return 'icon-at'   if roomData.t is 'd'
		return 'icon-at' + roomData.name if roomData.t is 'p' # @TODO review

	userData: ->
		console.log 'chatWindowDashboard.helpers userData' if window.rocketDebug
		roomData = Session.get('roomData' + this._id)

		return {} unless roomData

		if roomData.t is 'd'
			username = _.without roomData.usernames, Meteor.user().username
			UserManager.addUser username

			userData = {
				name: Session.get('user_' + username + '_name')
				emails: Session.get('user_' + username + '_emails') || []
				phone: Session.get('user_' + username + '_phone')
				username: String(username)
			}
			return userData

	autocompleteSettingsAddUser: ->
		console.log 'chatWindowDashboard.helpers autocompleteSettingsAddUser' if window.rocketDebug
		return {
			limit: 10
			# inputDelay: 300
			rules: [
				{
					collection: 'UserAndRoom'
					subscription: 'roomSearch'
					field: 'name'
					template: Template.roomSearch
					noMatchTemplate: Template.roomSearchEmpty
					matchAll: true
					filter: { type: 'u', uid: { $ne: Meteor.userId() } }
					sort: 'name'
				}
			]
		}

	autocompleteSettingsRoomSearch: ->
		console.log 'chatWindowDashboard.helpers autocompleteSettingsRoomSearch' if window.rocketDebug
		return {
			limit: 10
			# inputDelay: 300
			rules: [
				{
					collection: 'UserAndRoom'
					subscription: 'roomSearch'
					field: 'name'
					template: Template.roomSearch
					noMatchTemplate: Template.roomSearchEmpty
					matchAll: true
					filter: { uid: { $ne: Meteor.userId() } }
					sort: 'name'
				}
			]
		}

	isChannel: ->
		console.log 'chatWindowDashboard.helpers isChannel' if window.rocketDebug
		roomData = Session.get('roomData' + this._id)
		return '' unless roomData
		return roomData.t is 'c'

	canAddUser: ->
		console.log 'chatWindowDashboard.helpers canAddUser' if window.rocketDebug
		roomData = Session.get('roomData' + this._id)
		return '' unless roomData
		return roomData.t in ['p', 'c'] and roomData.u?._id is Meteor.userId()

	canEditName: ->
		console.log 'chatWindowDashboard.helpers canEditName' if window.rocketDebug
		roomData = Session.get('roomData' + this._id)
		return '' unless roomData
		return roomData.u?._id is Meteor.userId() and roomData.t in ['c', 'p']

	roomNameEdit: ->
		console.log 'chatWindowDashboard.helpers roomNameEdit' if window.rocketDebug
		return Session.get('roomData' + this._id)?.name

	editingTitle: ->
		console.log 'chatWindowDashboard.helpers editingTitle' if window.rocketDebug
		return 'hidden' if Session.get('editRoomTitle')

	showEditingTitle: ->
		console.log 'chatWindowDashboard.helpers showEditingTitle' if window.rocketDebug
		return 'hidden' if not Session.get('editRoomTitle')

	flexOpened: ->
		console.log 'chatWindowDashboard.helpers flexOpened' if window.rocketDebug
		return 'opened' if Session.equals('flexOpened', true)

	arrowPosition: ->
		console.log 'chatWindowDashboard.helpers arrowPosition' if window.rocketDebug
		return 'left' unless Session.equals('flexOpened', true)

	phoneNumber: ->
		console.log 'chatWindowDashboard.helpers phoneNumber' if window.rocketDebug
		return '' unless this.phoneNumber
		if this.phoneNumber.length > 10
			return "(#{this.phoneNumber.substr(0,2)}) #{this.phoneNumber.substr(2,5)}-#{this.phoneNumber.substr(7)}"
		else
			return "(#{this.phoneNumber.substr(0,2)}) #{this.phoneNumber.substr(2,4)}-#{this.phoneNumber.substr(6)}"

	isGroupChat: ->
		console.log 'chatWindowDashboard.helpers isGroupChat' if window.rocketDebug
		room = ChatRoom.findOne(this._id, { reactive: false })
		return room?.t in ['c', 'p']

	userActiveByUsername: (username) ->
		console.log 'chatWindowDashboard.helpers userActiveByUsername' if window.rocketDebug
		status = Session.get 'user_' + username + '_status'
		if status in ['online', 'away', 'busy']
			return {username: username, status: status}
		return

	roomUsers: ->
		console.log 'chatWindowDashboard.helpers roomUsers' if window.rocketDebug
		room = ChatRoom.findOne(this._id, { reactive: false })
		ret =
			_id: this._id
			total: room?.usernames.length
			totalOnline: 0
			users: room.usernames

		return ret

	flexUserInfo: ->
		console.log 'chatWindowDashboard.helpers flexUserInfo' if window.rocketDebug
		username = Session.get('showUserInfo')

		userData = {
			# name: Session.get('user_' + uid + '_name')
			# emails: Session.get('user_' + uid + '_emails')
			username: String(username)
		}
		# phone = Session.get('user_' + uid + '_phone')
		# if phone? and phone[0]?.phoneNumber
		# 	userData.phone = phone[0]?.phoneNumber

		return userData

	seeAll: ->
		console.log 'chatWindowDashboard.helpers seeAll' if window.rocketDebug
		if Template.instance().showUsersOffline.get()
			return t('See_only_online')
		else
			return t('See_all')

	getPupupConfig: ->
		console.log 'chatWindowDashboard.helpers getPupupConfig' if window.rocketDebug
		template = Template.instance()
		return {
			getInput: ->
				return template.find('.input-message')
		}


Template.chatWindowDashboard.events

	"click .flex-tab .more": (event) ->
		console.log 'chatWindowDashboard click .flex-tab .more' if window.rocketDebug
		Session.set('flexOpened', !Session.get('flexOpened'))

	'click .chat-new-messages': (event) ->
		console.log 'chatWindowDashboard click .chat-new-messages' if window.rocketDebug
		# chatMessages = $('#chat-window-' + this._id + ' .messages-box .wrapper')
		# chatMessages.animate({scrollTop: chatMessages[0].scrollHeight}, 'normal')
		$('#chat-window-' + this._id + ' .input-message').focus()

	'click .toggle-favorite': (event) ->
		console.log 'chatWindowDashboard click .toggle-favorite' if window.rocketDebug
		event.stopPropagation()
		event.preventDefault()
		Meteor.call 'toogleFavorite', this._id, !$('i', event.currentTarget).hasClass('favorite-room')

	'click .join': (event) ->
		console.log 'chatWindowDashboard click .join' if window.rocketDebug
		event.stopPropagation()
		event.preventDefault()
		Meteor.call 'joinRoom', this._id

	"click .burger": ->
		console.log 'chatWindowDashboard click .burger' if window.rocketDebug
		chatContainer = $("#rocket-chat")
		if chatContainer.hasClass("menu-closed")
			chatContainer.removeClass("menu-closed").addClass("menu-opened")
		else
			chatContainer.addClass("menu-closed").removeClass("menu-opened")

	'focus .input-message': (event) ->
		console.log 'chatWindowDashboard focus .input-message' if window.rocketDebug
		KonchatNotification.removeRoomNotification(this._id)

	'keydown .input-message': (event) ->
		console.log 'chatWindowDashboard keydown .input-message',this._id if window.rocketDebug
		ChatMessages.keydown(this._id, event, Template.instance())

	'keydown .input-message-editing': (event) ->
		console.log 'chatWindowDashboard keydown .input-message-editing',this._id if window.rocketDebug
		ChatMessages.keydownEditing(this._id, event)

	'blur .input-message-editing': (event) ->
		console.log 'chatWindowDashboard blur keydown blur .input-message-editing',this._id if window.rocketDebug
		ChatMessages.stopEditingLastMessage()

	'click .message-form .icon-paper-plane': (event) ->
		console.log 'chatWindowDashboard click .message-form .icon-paper-plane' if window.rocketDebug
		input = $(event.currentTarget).siblings("textarea")
		ChatMessages.send(this._id, input.get(0))

	'click .add-user': (event) ->
		console.log 'chatWindowDashboard click click .add-user' if window.rocketDebug
		toggleAddUser()

	'click .edit-room-title': (event) ->
		console.log 'chatWindowDashboard click .edit-room-title' if window.rocketDebug
		event.preventDefault()
		Session.set('editRoomTitle', true)
		$(".fixed-title").addClass "visible"
		Meteor.setTimeout ->
			$('#room-title-field').focus().select()
		, 10

	'keydown #user-add-search': (event) ->
		console.log 'chatWindowDashboard keydown #user-add-search' if window.rocketDebug
		if event.keyCode is 27 # esc
			toggleAddUser()

	'keydown #room-title-field': (event) ->
		console.log 'chatWindowDashboard keydown #room-title-field' if window.rocketDebug
		if event.keyCode is 27 # esc
			Session.set('editRoomTitle', false)
		else if event.keyCode is 13 # enter
			renameRoom this._id, $(event.currentTarget).val()

	'blur #room-title-field': (event) ->
		console.log 'chatWindowDashboard blur #room-title-field' if window.rocketDebug
		# TUDO: create a configuration to select the desired behaviour
		# renameRoom this._id, $(event.currentTarget).val()
		Session.set('editRoomTitle', false)
		$(".fixed-title").removeClass "visible"

	"click .flex-tab .user-image > a" : (e) ->
		console.log 'chatWindowDashboard click .flex-tab .user-image > a' if window.rocketDebug
		Session.set('flexOpened', true)
		Session.set('showUserInfo', $(e.currentTarget).data('username'))

	'click .user-card-message': (e) ->
		console.log 'chatWindowDashboard click .user-card-message' if window.rocketDebug
		roomData = Session.get('roomData' + this.rid)
		if roomData.t in ['c', 'p']
			Session.set('flexOpened', true)
			Session.set('showUserInfo', $(e.currentTarget).data('username'))
		else
			Session.set('flexOpened', true)

	'click .user-view nav .back': (e) ->
		console.log 'chatWindowDashboard click .user-view nav .back' if window.rocketDebug
		Session.set('showUserInfo', null)

	'click .user-view nav .pvt-msg': (e) ->
		console.log 'chatWindowDashboard click .user-view nav .pvt-msg' if window.rocketDebug
		Meteor.call 'createDirectMessage', Session.get('showUserInfo'), (error, result) ->
			if error
				return Errors.throw error.reason

			if result?.rid?
				Router.go('room', { _id: result.rid })

	'click button.load-more': (e) ->
		console.log 'chatWindowDashboard click button.load-more' if window.rocketDebug
		RoomHistoryManager.getMore this._id

	'autocompleteselect #user-add-search': (event, template, doc) ->
		console.log 'chatWindowDashboard autocompleteselect #user-add-search' if window.rocketDebug
		roomData = Session.get('roomData' + Session.get('openedRoom'))

		if roomData.t is 'd'
			Meteor.call 'createGroupRoom', roomData.usernames, doc.username, (error, result) ->
				if error
					return Errors.throw error.reason

				if result?.rid?
					# Router.go('room', { _id: result.rid })
					$('#user-add-search').val('')
		else if roomData.t in ['c', 'p']
			Meteor.call 'addUserToRoom', { rid: roomData._id, username: doc.username }, (error, result) ->
				if error
					return Errors.throw error.reason

				$('#user-add-search').val('')
				toggleAddUser()

	'autocompleteselect #room-search': (event, template, doc) ->
		console.log 'chatWindowDashboard autocompleteselect #room-search' if window.rocketDebug
		if doc.type is 'u'
			Meteor.call 'createDirectMessage', doc.uid, (error, result) ->
				if error
					return Errors.throw error.reason

				if result?.rid?
					Router.go('room', { _id: result.rid })
					$('#room-search').val('')
		else
			Router.go('room', { _id: doc.rid })
			$('#room-search').val('')

	'scroll .wrapper': (e, instance) ->
		# console.log 'chatWindowDashboard scroll .wrapper' if window.rocketDebug
		# if e.currentTarget.offsetHeight + e.currentTarget.scrollTop < e.currentTarget.scrollHeight
		# 	instance.scrollOnBottom = false
		# else
		# 	instance.scrollOnBottom = true
		# 	$('.new-message').addClass('not')

	'click .new-message': (e) ->
		console.log 'chatWindowDashboard click .new-message' if window.rocketDebug
		$(e.currentTarget).addClass('not')

	'click .see-all': (e, instance) ->
		console.log 'chatWindowDashboard click .see-all' if window.rocketDebug
		instance.showUsersOffline.set(!instance.showUsersOffline.get())

Template.chatWindowDashboard.onCreated ->
	console.log 'chatWindowDashboard.onCreated' if window.rocketDebug
	# this.scrollOnBottom = true
	this.showUsersOffline = new ReactiveVar false

Template.chatWindowDashboard.onRendered ->
	console.log 'chatWindowDashboard.onRendered' if window.rocketDebug
	FlexTab.check()
	ChatMessages.init()
	ScrollListener.init()

	console.log 'chatWindowDashboard.rendered' if window.rocketDebug
	# salva a data da renderização para exibir alertas de novas mensagens
	$.data(this.firstNode, 'renderedAt', new Date)

renameRoom = (rid, name) ->
	console.log 'chatWindowDashboard renameRoom' if window.rocketDebug
	if Session.get('roomData' + rid).name == name
		Session.set('editRoomTitle', false)
		return false

	Meteor.call 'saveRoomName', rid, name, (error, result) ->
		if result
			Session.set('editRoomTitle', false)

			toastr.success t('Room_name_changed_successfully')
		if error
			toastr.error error.reason

toggleAddUser = ->
	console.log 'chatWindowDashboard toggleAddUser' if window.rocketDebug
	btn = $('.add-user')
	$('.add-user-search').toggleClass('show-search')
	if $('i', btn).hasClass('icon-plus')
		$('#user-add-search').focus()
		$('i', btn).removeClass('icon-plus').addClass('icon-cancel')
	else
		$('#user-add-search').val('')
		$('i', btn).removeClass('icon-cancel').addClass('icon-plus')
