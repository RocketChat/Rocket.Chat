Template.membersList.onCreated ->
	@mainVideo = new ReactiveVar '$auto'


Template.membersList.helpers
	videoActive: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).localUrl.get()? or WebRTC.getInstanceByRoomId(Session.get('openedRoom')).remoteItems.get()?.length > 0

	callInProgress: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).callInProgress.get()

	audioEnabled: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).audioEnabled.get()

	videoEnabled: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).videoEnabled.get()

	audioAndVideoEnabled: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).audioEnabled.get() and WebRTC.getInstanceByRoomId(Session.get('openedRoom')).videoEnabled.get()

	remoteVideoItems: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).remoteItems.get()

	selfVideoUrl: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).localUrl.get()

	mainVideoUrl: ->
		template = Template.instance()
		webrtc = WebRTC.getInstanceByRoomId(Session.get('openedRoom'))

		if template.mainVideo.get() is '$self'
			return webrtc.localUrl.get()

		if template.mainVideo.get() is '$auto'
			remoteItems = webrtc.remoteItems.get()
			if remoteItems?.length > 0
				return remoteItems[0].url

			return webrtc.localUrl.get()

		if webrtc.remoteItemsById.get()[template.mainVideo.get()]?
			return webrtc.remoteItemsById.get()[template.mainVideo.get()].url
		else
			template.mainVideo.set '$auto'
			return

	mainVideoUsername: ->
		template = Template.instance()
		webrtc = WebRTC.getInstanceByRoomId(Session.get('openedRoom'))

		if template.mainVideo.get() is '$self'
			return t 'you'

		if template.mainVideo.get() is '$auto'
			remoteItems = webrtc.remoteItems.get()
			if remoteItems?.length > 0
				return Meteor.users.findOne(remoteItems[0].id)?.username

			return t 'you'

		if webrtc.remoteItemsById.get()[template.mainVideo.get()]?
			return Meteor.users.findOne(webrtc.remoteItemsById.get()[template.mainVideo.get()].id)?.username
		else
			template.mainVideo.set '$auto'
			return

	usernameByUserId: (userId) ->
		return Meteor.users.findOne(userId)?.username

	tAddUsers: ->
		return t('Add_users')

	isGroupChat: ->
		room = ChatRoom.findOne(Session.get('openedRoom'), { reactive: false })
		return room?.t in ['c', 'p']

	isDirectChat: ->
		room = ChatRoom.findOne(Session.get('openedRoom'), { reactive: false })
		return room?.t is 'd'

	roomUsers: ->
		room = ChatRoom.findOne(Session.get('openedRoom'), { reactive: false })
		users = []
		onlineUsers = RoomManager.onlineUsers.get()

		for username in room?.usernames or []
			if onlineUsers[username]?
				utcOffset = onlineUsers[username]?.utcOffset
				if utcOffset?
					if utcOffset > 0
						utcOffset = "+#{utcOffset}"

					utcOffset = "(UTC #{utcOffset})"

				users.push
					username: username
					status: onlineUsers[username]?.status
					utcOffset: utcOffset

		users = _.sortBy users, 'username'

		ret =
			_id: Session.get('openedRoom')
			total: room?.usernames?.length or 0
			totalOnline: users.length
			users: users

		return ret

	canAddUser: ->
		roomData = Session.get('roomData' + Session.get('openedRoom'))
		return '' unless roomData
		return roomData.t in ['p', 'c'] and roomData.u?._id is Meteor.userId()

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
					filter: { type: 'u', uid: { $ne: Meteor.userId() }, active: { $eq: true } }
					sort: 'name'
				}
			]
		}

	flexUserInfo: ->
		username = Session.get('showUserInfo')
		return Meteor.users.findOne({ username: String(username) }) or { username: String(username) }


Template.membersList.events
	"click .flex-tab .user-image > a" : (e) ->
		RocketChat.TabBar.openFlex()
		Session.set('showUserInfo', $(e.currentTarget).data('username'))

	'autocompleteselect #user-add-search': (event, template, doc) ->
		roomData = Session.get('roomData' + Session.get('openedRoom'))

		if roomData.t is 'd'
			Meteor.call 'createGroupRoom', roomData.usernames, doc.username, (error, result) ->
				if error
					return Errors.throw error.reason

				if result?.rid?
					$('#user-add-search').val('')
		else if roomData.t in ['c', 'p']
			Meteor.call 'addUserToRoom', { rid: roomData._id, username: doc.username }, (error, result) ->
				if error
					return Errors.throw error.reason

				$('#user-add-search').val('')

	'click .start-video-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).startCall({audio: true, video: true})

	'click .start-audio-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).startCall({audio: true})

	'click .join-video-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).joinCall({audio: true, video: true})

	'click .join-audio-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).joinCall({audio: true})

	'click .stop-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).stop()

	'click .video-item': (e, t) ->
		t.mainVideo.set $(e.currentTarget).data('username')

	'click .disable-audio': (e, t) ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).disableAudio()

	'click .enable-audio': (e, t) ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).enableAudio()

	'click .disable-video': (e, t) ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).disableVideo()

	'click .enable-video': (e, t) ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).enableVideo()

	'loadstart video[muted]': (e) ->
		e.currentTarget.muted = true
		e.currentTarget.volume = 0

