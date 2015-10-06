currentTracker = undefined

openRoom = (type, name) ->
	Session.set 'openedRoom', null

	Meteor.defer ->
		currentTracker = Tracker.autorun (c) ->
			if RoomManager.open(type + name).ready() isnt true
				BlazeLayout.render 'main', {center: 'loading'}
				return

			currentTracker = undefined
			c.stop()

			query =
				t: type
				name: name

			if type is 'd'
				delete query.name
				query.usernames =
					$all: [name, Meteor.user()?.username]

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

			RocketChat.TabBar.resetButtons()
			RocketChat.TabBar.addButton({ id: 'message-search', title: t('Search'), icon: 'octicon octicon-search', template: 'messageSearch', order: 1 })
			if type is 'd'
				RocketChat.TabBar.addButton({ id: 'members-list', title: t('User_Info'), icon: 'octicon octicon-person', template: 'membersList', order: 2 })
			else
				RocketChat.TabBar.addButton({ id: 'members-list', title: t('Members_List'), icon: 'octicon octicon-organization', template: 'membersList', order: 2 })
			RocketChat.TabBar.addButton({ id: 'uploaded-files-list', title: t('Room_uploaded_file_list'), icon: 'octicon octicon-file-symlink-directory', template: 'uploadedFilesList', order: 3 })

			# update user's room subscription
			if ChatSubscription.findOne({rid: room._id})?.open is false
				Meteor.call 'openRoom', room._id

			RocketChat.callbacks.run 'enter-room'

roomExit = ->
	BlazeLayout.render 'main', {center: 'none'}

	if currentTracker?
		currentTracker.stop()

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


FlowRouter.goToRoomById = (roomId) ->
	subscription = ChatSubscription.findOne({rid: roomId})
	if subscription?
		switch subscription.t
			when 'c'
				FlowRouter.go 'channel', {name: subscription.name}

			when 'p'
				FlowRouter.go 'group', {name: subscription.name}

			when 'd'
				FlowRouter.go 'direct', {username: subscription.name}
