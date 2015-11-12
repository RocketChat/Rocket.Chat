Meteor.startup ->
	roles = ['admin', 'moderator', 'user']
	RocketChat.roomTypes.addType('starredRooms', roles);
	RocketChat.roomTypes.addType('channels', roles);
	RocketChat.roomTypes.addType('directMessages', roles);
	RocketChat.roomTypes.addType('privateGroups', roles);

	RocketChat.roomTypes.setIcon('c', 'icon-hash');
	RocketChat.roomTypes.setIcon('d', 'icon-at');
	RocketChat.roomTypes.setIcon('p', 'icon-lock');

	RocketChat.roomTypes.setRoute 'c', 'channel', (sub) ->
		return { name: sub.name }

	RocketChat.roomTypes.setRoute 'd', 'direct', (sub) ->
		return { username: sub.name }

	RocketChat.roomTypes.setRoute 'p', 'group', (sub) ->
		return { name: sub.name }
