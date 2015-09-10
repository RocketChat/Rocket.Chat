Template.membersList.helpers
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
					filter: { type: 'u', uid: { $ne: Meteor.userId() } }
					sort: 'name'
				}
			]
		}

	flexUserInfo: ->
		username = Session.get('showUserInfo')
		return Meteor.users.findOne({ username: String(username) }) or { username: String(username) }

Template.membersList.events
	"click .flex-tab .more": (event, t) ->
		if (Session.get('flexOpened'))
			Session.set('rtcLayoutmode', 0)
			Session.set('flexOpened',false)
			t.searchResult.set undefined
		else
			Session.set('flexOpened', true)


	"click .flex-tab  .video-remote" : (e) ->
		if (Session.get('flexOpened'))
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

	'keydown #user-add-search': (event) ->
		if event.keyCode is 27 # esc
			toggleAddUser()

	"click .flex-tab .user-image > a" : (e) ->
		Session.set('flexOpened', true)
		Session.set('showUserInfo', $(e.currentTarget).data('username'))

	'click .user-view nav .back': (e) ->
		Session.set('showUserInfo', null)

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
				toggleAddUser()

	'click .see-all': (e, instance) ->
		instance.showUsersOffline.set(!instance.showUsersOffline.get())

	'click .start-video': (event) ->
		_id = Template.instance().data._id
		webrtc.to = _id.replace(Meteor.userId(), '')
		webrtc.room = _id
		webrtc.mode = 1
		webrtc.start(true)

	'click .stop-video': (event) ->
		webrtc.stop()

	'click .monitor-video': (event) ->
		_id = Template.instance().data._id
		webrtc.to = _id.replace(Meteor.userId(), '')
		webrtc.room = _id
		webrtc.mode = 2
		webrtc.start(true)


	'click .setup-video': (event) ->
		webrtc.mode = 2
		webrtc.activateLocalStream()
