Meteor.startup ->
	roles = ['admin', 'moderator', 'user']

	RocketChat.roomTypes.add 'c',
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
		permissions: [ 'view-channel' ]

	RocketChat.roomTypes.add 'd',
		template: 'directMessages'
		icon: 'icon-at'
		route:
			name: 'direct'
			path: '/direct/:username'
			action: (params, queryParams) ->
				Session.set 'showUserInfo'
				openRoom 'd', params.name
			link: (sub) ->
				return { username: sub.name }
		permissions: [ 'view-direct' ]

	RocketChat.roomTypes.add 'p',
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
		permissions: [ 'view-group' ]

	# RocketChat.roomTypes.addPublish 'c', (identifier) ->
	# 	publish: (identifier) ->
	# 		options =
	# 			fields:
	# 				name: 1
	# 				t: 1
	# 				cl: 1
	# 				u: 1
	# 				usernames: 1
	# 		return RocketChat.models.Rooms.findByTypeAndName 'c', identifier, options




	# RocketChat.roomTypes.addType('starredRooms', roles);
	# RocketChat.roomTypes.addType('channels', roles);
	# RocketChat.roomTypes.addType('directMessages', roles);
	# RocketChat.roomTypes.addType('privateGroups', roles);

	# RocketChat.roomTypes.setIcon('c', 'icon-hash');
	# RocketChat.roomTypes.setIcon('d', 'icon-at');
	# RocketChat.roomTypes.setIcon('p', 'icon-lock');

	# RocketChat.roomTypes.setRoute 'c', 'channel', (sub) ->
	# 	return { name: sub.name }

	# RocketChat.roomTypes.setRoute 'd', 'direct', (sub) ->
	# 	return { username: sub.name }

	# RocketChat.roomTypes.setRoute 'p', 'group', (sub) ->
	# 	return { name: sub.name }
