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
	condition: ->
		return RocketChat.authz.hasAllPermission 'view-c-room'

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
	condition: ->
		return RocketChat.authz.hasAllPermission 'view-p-room'
