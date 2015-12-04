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
			Session.set 'showUserInfo'
			openRoom 'c', params.name
		link: (sub) ->
			return { name: sub.name }
	permissions: [ 'view-c-room' ]

RocketChat.roomTypes.add 'd', 20,
	template: 'directMessages'
	icon: 'icon-at'
	route:
		name: 'direct'
		path: '/direct/:username'
		action: (params, queryParams) ->
			Session.set 'showUserInfo', params.username
			openRoom 'd', params.username
		link: (sub) ->
			return { username: sub.name }
	permissions: [ 'view-d-room' ]

RocketChat.roomTypes.add 'p', 30,
	template: 'privateGroups'
	icon: 'icon-lock'
	route:
		name: 'group'
		path: '/group/:name'
		action: (params, queryParams) ->
			Session.set 'showUserInfo'
			openRoom 'p', params.name
		link: (sub) ->
			return { name: sub.name }
	permissions: [ 'view-p-room' ]
