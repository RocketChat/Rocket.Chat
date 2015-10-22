Meteor.startup ->
	RocketChat.roomTypes.addType('starredRooms', 'user');
	RocketChat.roomTypes.addType('channels', 'user');
	RocketChat.roomTypes.addType('directMessages', 'user');
	RocketChat.roomTypes.addType('privateGroups', 'user');

	RocketChat.roomTypes.setRoute 'c', 'channel', (sub) ->
		return { name: sub.name }

	RocketChat.roomTypes.setRoute 'd', 'direct', (sub) ->
		return { username: sub.name }

	RocketChat.roomTypes.setRoute 'p', 'group', (sub) ->
		return { name: sub.name }
