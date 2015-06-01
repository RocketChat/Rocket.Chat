# @TODO bug com o botão para "rolar até o fim" (novas mensagens) quando há uma mensagem com texto que gere rolagem horizontal
Template.chatWindowDashboard.helpers
	tAddUsers: ->
		return t('chatWindowDashboard.Add_users')
	tQuickSearch: ->
		return t('chatWindowDashboard.Quick_Search')
	favorite: ->
		console.log 'chatWindowDashboard.favorite' if window.rocketDebug
		sub = ChatSubscription.findOne { rid: this._id, uid: Meteor.userId() }
		return 'icon-star favorite-room' if sub?.f? and sub.f

		return 'icon-star-empty'

	messages: ->
		console.log 'chatWindowDashboard.messages' if window.rocketDebug
		window.lastMessageWindow[this._id] = undefined
		return ChatMessage.find { rid: this._id }, { sort: { ts: 1 } }

	messagesHistory: ->
		return ChatMessageHistory.find { rid: this._id }, { sort: { ts: 1 } }

	hasMore: ->
		return RoomHistoryManager.hasMore this._id

	isLoading: ->
		return 'btn-loading' if RoomHistoryManager.isLoading this._id

	windowId: ->
		console.log 'chatWindowDashboard.windowId' if window.rocketDebug
		return "chat-window-#{this._id}"

	showTyping: ->
		console.log 'chatWindowDashboard.showTyping' if window.rocketDebug

		return this.t is 't'

	typing: ->
		console.log 'chatWindowDashboard.typing' if window.rocketDebug
		return this.uid isnt Meteor.userId()

	usersTyping: ->
		messages = ChatMessage.find { rid: this._id }, { sort: { ts: 1 } }
		usernames = []
		selfTyping = false
		messages.forEach (message) ->
			if message.t is 't'
				if message.uid is Meteor.userId()
					selfTyping = true
				else
					username = Session.get('user_' + message.uid + '_name')
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

	newDate: ->
		console.log 'chatWindowDashboard.newDate' if window.rocketDebug

		lastMessageDate = window.lastMessageWindow[this.rid]
		d = moment(this.ts).format('YYYYMMDD')

		window.lastMessageWindow[this.rid] =
			mid: this._id
			date: d

		if not lastMessageDate?
			return false

		if lastMessageDate.mid is this._id
			last = ChatMessage.find({ts: {$lt: this.ts}, t: {$exists: false}}, { sort: { ts: -1 }, limit: 1 }).fetch()[0]
			if not last?
				return false
			lastMessageDate =
				mid: last._id
				date: moment(last.ts).format('YYYYMMDD')

		return lastMessageDate.date isnt d

	messageDate: ->
		console.log 'chatWindowDashboard.messageDate' if window.rocketDebug
		return moment(this.ts).format('LL')

	roomName: ->
		console.log 'chatWindowDashboard.roomName' if window.rocketDebug
		roomData = Session.get('roomData' + this._id)
		return '' unless roomData
		return roomData.name

	roomTypeIcon: ->
		console.log 'chatWindowDashboard.roomType' if window.rocketDebug
		roomData = Session.get('roomData' + this._id)
		return '' unless roomData
		return 'icon-hash' if roomData.t is 'c'
		return 'icon-at'   if roomData.t is 'd'
		return 'icon-at' + roomData.name if roomData.t is 'p' # @TODO review

	userData: ->
		console.log 'chatWindowDashboard.userData' if window.rocketDebug
		roomData = Session.get('roomData' + this._id)

		return {} unless roomData

		if roomData.t is 'd'
			uid = _.without roomData.uids, Meteor.userId()
			UserManager.addUser uid

			userData = {
				name: Session.get('user_' + uid + '_name')
				emails: Session.get('user_' + uid + '_emails') || []
				phone: Session.get('user_' + uid + '_phone')
				uid: String(uid)
			}
			return userData

	autocompleteSettingsAddUser: ->
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
		roomData = Session.get('roomData' + this._id)

		return '' unless roomData

		return roomData.t is 'c'

	canAddUser: ->
		roomData = Session.get('roomData' + this._id)

		return '' unless roomData

		return roomData.t in ['p', 'c'] and roomData.uid is Meteor.userId()

	canEditName: ->
		roomData = Session.get('roomData' + this._id)

		return '' unless roomData

		return roomData.uid is Meteor.userId() and roomData.t in ['c', 'p']

	roomNameEdit: ->
		return Session.get('roomData' + this._id)?.name

	editingTitle: ->
		return 'hidden' if Session.get('editRoomTitle')

	showEditingTitle: ->
		return 'hidden' if not Session.get('editRoomTitle')

	flexOpened: ->
		return 'opened' if Session.equals('flexOpened', true)

	arrowPosition: ->
		return 'left' unless Session.equals('flexOpened', true)

	phoneNumber: ->
		return '' unless this.phoneNumber

		if this.phoneNumber.length > 10
			return "(#{this.phoneNumber.substr(0,2)}) #{this.phoneNumber.substr(2,5)}-#{this.phoneNumber.substr(7)}"
		else
			return "(#{this.phoneNumber.substr(0,2)}) #{this.phoneNumber.substr(2,4)}-#{this.phoneNumber.substr(6)}"

	isGroupChat: ->
		room = ChatRoom.findOne(this._id, { reactive: false })
		return room?.t in ['c', 'p']

	roomUsers: ->
		room = ChatRoom.findOne(this._id, { reactive: false })
		ret =
			_id: this._id
			total: room?.uids.length
			totalOnline: 0
			users: []

		if room?.uids
			# UserManager.addUser room.uids

			filter =
				_id:
					$in: room?.uids

			# unless Template.instance().showUsersOffline.get()
			# 	filter.status = { $ne: 'offline' }

			filter.$and = [{ status: {$exists: true} }, { status: {$ne: 'offline'} }]

			users = Meteor.users.find(filter, { sort: { name: 1 } } ).fetch()
			ret.totalOnline = users.length
			ret.users = users

		return ret

	flexUserInfo: ->
		uid = Session.get('showUserInfo')

		userData = {
			name: Session.get('user_' + uid + '_name')
			emails: Session.get('user_' + uid + '_emails')
			uid: String(uid)
		}
		phone = Session.get('user_' + uid + '_phone')
		if phone? and phone[0]?.phoneNumber
			userData.phone = phone[0]?.phoneNumber

		return userData

	seeAll: ->
		if Template.instance().showUsersOffline.get()
			return t('chatWindowDashboard.See_only_online')
		else
			return t('chatWindowDashboard.See_all')

	getPupupConfig: ->
		template = Template.instance()
		return {
			getInput: ->
				return template.find('.input-message')
		}


Template.chatWindowDashboard.events
	"click .flex-tab .more": (event) ->
		Session.set('flexOpened', !Session.get('flexOpened'))

	'click .chat-new-messages': (event) ->
		console.log 'chatWindowDashboard.click.chat-new-messages' if window.rocketDebug
		chatMessages = $('#chat-window-' + this._id + ' .messages-box')
		chatMessages.animate({scrollTop: chatMessages[0].scrollHeight}, 'normal')
		$('#chat-window-' + this._id + ' .input-message').focus()

	'click .toggle-favorite': (event) ->
		console.log 'chatWindowDashboard.click.toggle-favorite' if window.rocketDebug
		event.stopPropagation()
		event.preventDefault()
		Meteor.call 'toogleFavorite', this._id, !$('i', event.currentTarget).hasClass('favorite-room')

	"click .burger": ->
		chatContainer = $("#rocket-chat")
		if chatContainer.hasClass("menu-closed")
			chatContainer.removeClass("menu-closed").addClass("menu-opened")
		else
			chatContainer.addClass("menu-closed").removeClass("menu-opened")

	'focus .input-message': (event) ->
		console.log 'chatWindowDashboard.focus.input-message' if window.rocketDebug
		KonchatNotification.removeRoomNotification(this._id)

	'keydown .input-message': (event) ->
		console.log 'chatWindowDashboard.keydown.input-message',this._id if window.rocketDebug
		ChatMessages.keydown(this._id, event, Template.instance())

	'keydown .input-message-editing': (event) ->
		console.log 'chatWindowDashboard.keydown.input-message-editing',this._id if window.rocketDebug
		ChatMessages.keydownEditing(this._id, event)

	'blur .input-message-editing': (event) ->
		console.log 'chatWindowDashboard.blur.input-message-editing',this._id if window.rocketDebug
		ChatMessages.stopEditingLastMessage()

	'click .message-form .icon-paper-plane': (event) ->
		input = $(event.currentTarget).siblings("textarea")
		ChatMessages.send(this._id, input.get(0))

	'click .add-user': (event) ->
		toggleAddUser()

	'click .edit-room-title': (event) ->
		event.preventDefault()

		Session.set('editRoomTitle', true)

		Meteor.setTimeout ->
			$('#room-title-field').focus().select()
		, 10

	'keydown #user-add-search': (event) ->
		if event.keyCode is 27 # esc
			toggleAddUser()

	'keydown #room-title-field': (event) ->
		if event.keyCode is 27 # esc
			Session.set('editRoomTitle', false)
		else if event.keyCode is 13 # enter
			renameRoom this._id, $(event.currentTarget).val()

	'blur #room-title-field': (event) ->
		# TUDO: create a configuration to select the desired behaviour
		# renameRoom this._id, $(event.currentTarget).val()
		Session.set('editRoomTitle', false)

	"click .flex-tab .user-image > a" : (e) ->
		Session.set('flexOpened', true)
		Session.set('showUserInfo', $(e.currentTarget).data('userid'))

	'click .user-card-message': (e) ->
		roomData = Session.get('roomData' + this.rid)
		if roomData.t in ['c', 'p']
			Session.set('flexOpened', true)
			Session.set('showUserInfo', $(e.currentTarget).data('userid'))
		else
			Session.set('flexOpened', true)

	'click .user-view nav .back': (e) ->
		Session.set('showUserInfo', null)

	'click .user-view nav .pvt-msg': (e) ->
		Meteor.call 'createDirectRoom', Session.get('showUserInfo'), (error, result) ->
			if error
				return Errors.throw error.reason

			if result.rid?
				Router.go('room', { _id: result.rid })

	'click button.load-more': (e) ->
		RoomHistoryManager.getMore this._id

	'autocompleteselect #user-add-search': (event, template, doc) ->
		roomData = Session.get('roomData' + Session.get('openedRoom'))

		if roomData.t is 'd'
			Meteor.call 'createGroupRoom', roomData.uids, doc.uid, (error, result) ->
				if error
					return Errors.throw error.reason

				if result?.rid?
					Router.go('room', { _id: result.rid })
					$('#user-add-search').val('')
		else if roomData.t in ['c', 'p']
			Meteor.call 'addUserToRoom', { rid: roomData._id, uid: doc.uid }, (error, result) ->
				if error
					return Errors.throw error.reason

				if result
					$('#user-add-search').val('')
					toggleAddUser()

	'autocompleteselect #room-search': (event, template, doc) ->
		if doc.type is 'u'
			Meteor.call 'createDirectRoom', doc.uid, (error, result) ->
				if error
					return Errors.throw error.reason

				if result?.rid?
					Router.go('room', { _id: result.rid })
					$('#room-search').val('')
		else
			Router.go('room', { _id: doc.rid })
			$('#room-search').val('')

	'scroll .wrapper': (e, instance) ->
		if e.currentTarget.offsetHeight + e.currentTarget.scrollTop < e.currentTarget.scrollHeight
			instance.scrollOnBottom = false
		else
			instance.scrollOnBottom = true
			$('.new-message').addClass('not')

	'click .new-message': (e) ->
		$('.messages-box .wrapper').stop().animate({scrollTop: 99999}, 1000 )
		$(e.currentTarget).addClass('not')

	'click .see-all': (e, instance) ->
		instance.showUsersOffline.set(!instance.showUsersOffline.get())

Template.chatWindowDashboard.onCreated ->
	this.scrollOnBottom = true
	this.showUsersOffline = new ReactiveVar false

	# this.subscribe("allUsers")

Template.chatWindowDashboard.onRendered ->
	FlexTab.check()
	ChatMessages.init()

	console.log 'chatWindowDashboard.rendered' if window.rocketDebug
	# salva a data da renderização para exibir alertas de novas mensagens
	$.data(this.firstNode, 'renderedAt', new Date)

renameRoom = (roomId, name) ->
	if Session.get('roomData' + roomId).name == name
		Session.set('editRoomTitle', false)
		return false

	Meteor.call 'saveRoomName', { rid: roomId, name: name }, (error, result) ->
		if result
			Session.set('editRoomTitle', false)

			toastr.success t('chatWindowDashboard.Room_name_changed_successfully')
		if error
			toastr.error error.reason

toggleAddUser = ->
	btn = $('.add-user')
	$('.add-user-search').toggleClass('show-search')
	if $('i', btn).hasClass('icon-plus')
		$('#user-add-search').focus()
		$('i', btn).removeClass('icon-plus').addClass('icon-cancel')
	else
		$('#user-add-search').val('')
		$('i', btn).removeClass('icon-cancel').addClass('icon-plus')
