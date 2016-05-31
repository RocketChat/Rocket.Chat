RocketChat.roomTypes.add null, 0,
	template: 'starredRooms'
	icon: 'icon-star'

RocketChat.roomTypes.add 'c', 10,
	template: 'channels'
	icon: 'icon-hash'
	route:
		name: 'channel'
		path: '/channel/:name'
		action: (params, queryParams) ->
			openRoom 'c', params.name
			RocketChat.TabBar.showGroup 'channel'
		link: (sub) ->
			return { name: sub.name }
	findRoom: (identifier) ->
		query =
			t: 'c'
			name: identifier
		return ChatRoom.findOne(query)
	roomName: (roomData) ->
		return roomData.name
	condition: ->
		return RocketChat.authz.hasAtLeastOnePermission ['view-c-room', 'view-joined-room']

RocketChat.roomTypes.add 'd', 20,
	template: 'directMessages'
	icon: 'icon-at'
	route:
		name: 'direct'
		path: '/direct/:username'
		action: (params, queryParams) ->
			openRoom 'd', params.username
			RocketChat.TabBar.showGroup 'directmessage'
		link: (sub) ->
			return { username: sub.name }
	findRoom: (identifier, user) ->
		query =
			t: 'd'
			usernames:
				$all: [identifier, user.username]
		return ChatRoom.findOne(query)
	roomName: (roomData) ->
		return ChatSubscription.findOne({ rid: roomData._id }, { fields: { name: 1 } })?.name
	condition: ->
		return RocketChat.authz.hasAllPermission 'view-d-room'

RocketChat.roomTypes.add 'p', 30,
	template: 'privateGroups'
	icon: 'icon-lock'
	route:
		name: 'group'
		path: '/group/:name'
		action: (params, queryParams) ->
			openRoom 'p', params.name
			RocketChat.TabBar.showGroup 'privategroup'
		link: (sub) ->
			return { name: sub.name }
	findRoom: (identifier) ->
		query =
			t: 'p'
			name: identifier
		return ChatRoom.findOne(query)
	roomName: (roomData) ->
		return roomData.name
	condition: ->
		return RocketChat.authz.hasAllPermission 'view-p-room'
