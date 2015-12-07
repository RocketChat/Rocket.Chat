Template.membersList.helpers
	tAddUsers: ->
		return t('Add_users')

	isGroupChat: ->
		return ChatRoom.findOne(this.rid, { reactive: false })?.t in ['c', 'p']

	isDirectChat: ->
		return ChatRoom.findOne(this.rid, { reactive: false })?.t is 'd'

	roomUsers: ->
		users = []
		onlineUsers = RoomManager.onlineUsers.get()

		for username in ChatRoom.findOne(this.rid)?.usernames or []
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
			_id: this.rid
			total: ChatRoom.findOne(this.rid)?.usernames?.length or 0
			totalOnline: users.length
			users: users

		return ret

	canAddUser: ->
		roomData = Session.get('roomData' + this._id)
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
					field: 'username'
					template: Template.roomSearch
					noMatchTemplate: Template.roomSearchEmpty
					matchAll: true
					filter: { type: 'u', uid: { $ne: Meteor.userId() }, active: { $eq: true } }
					sort: 'username'
				}
			]
		}

	flexUserInfo: ->
		username = Session.get('showUserInfo')
		return Meteor.users.findOne({ username: String(username) }) or { username: String(username) }

	showUserInfo: ->
		webrtc = WebRTC.getInstanceByRoomId(this.rid)
		videoActive = webrtc?.localUrl?.get()? or webrtc?.remoteItems?.get()?.length > 0
		return Session.get('showUserInfo') and not videoActive

Template.membersList.events
	"click .flex-tab .user-image > a" : (e) ->
		RocketChat.TabBar.openFlex()
		Session.set('showUserInfo', $(e.currentTarget).data('username'))

	'autocompleteselect #user-add-search': (event, template, doc) ->

		roomData = Session.get('roomData' + template.data.rid)

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
