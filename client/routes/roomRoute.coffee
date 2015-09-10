openRoom = (type, name) ->
	Session.set 'openedRoom', null

	BlazeLayout.render 'main', {center: 'loading'}

	Meteor.defer ->
		Tracker.autorun (c) ->
			if RoomManager.open(type + name).ready() isnt true
				return

			c.stop()

			query =
				t: type
				name: name

			if type is 'd'
				delete query.name
				query.usernames =
					$all: [name, Meteor.user().username]

			room = ChatRoom.findOne(query)
			if not room?
				Session.set 'roomNotFound', {type: type, name: name}
				BlazeLayout.render 'main', {center: 'roomNotFound'}
				return

			mainNode = document.querySelector('.main-content')
			if mainNode?
				for child in mainNode.children
					mainNode.removeChild child if child?
				roomDom = RoomManager.getDomOfRoom(type + name, room._id)
				mainNode.appendChild roomDom
				if roomDom.classList.contains('room-container')
					roomDom.querySelector('.messages-box > .wrapper').scrollTop = roomDom.oldScrollTop

			Session.set 'openedRoom', room._id

			Session.set 'editRoomTitle', false
			RoomManager.updateMentionsMarksOfRoom type + name
			Meteor.setTimeout ->
				readMessage.readNow()
			, 2000
			# KonchatNotification.removeRoomNotification(params._id)

			if Meteor.Device.isDesktop()
				setTimeout ->
					$('.message-form .input-message').focus()
				, 100


roomExit = ->
	mainNode = document.querySelector('.main-content')
	if mainNode?
		for child in mainNode.children
			if child?
				if child.classList.contains('room-container')
					wrapper = child.querySelector('.messages-box > .wrapper')
					if wrapper.scrollTop >= wrapper.scrollHeight - wrapper.clientHeight
						child.oldScrollTop = 10e10
					else
						child.oldScrollTop = wrapper.scrollTop
				mainNode.removeChild child


FlowRouter.route '/channel/:name',
	name: 'channel'

	action: (params, queryParams) ->
		Session.set 'showUserInfo'
		openRoom 'c', params.name

	triggersExit: [roomExit]


FlowRouter.route '/group/:name',
	name: 'group'

	action: (params, queryParams) ->
		Session.set 'showUserInfo'
		openRoom 'p', params.name

	triggersExit: [roomExit]


FlowRouter.route '/direct/:username',
	name: 'direct'

	action: (params, queryParams) ->
		Session.set 'showUserInfo', params.username
		openRoom 'd', params.username

	triggersExit: [roomExit]
