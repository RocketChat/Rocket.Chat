Template.membersList.helpers
	remoteVideoUrl: ->
		return Session.get('remoteVideoUrl')

	selfVideoUrl: ->
		return Session.get('selfVideoUrl')

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
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).startCall()

	'click .stop-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).stop()
