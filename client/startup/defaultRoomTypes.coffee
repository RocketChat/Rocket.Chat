Meteor.startup ->
	# RocketChat.roomTypes.addType('starredRooms', roles);

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
		permissions: [ 'view-c-room' ]

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
		permissions: [ 'view-d-room' ]

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
		permissions: [ 'view-p-room' ]
