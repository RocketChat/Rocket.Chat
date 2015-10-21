Meteor.startup ->
	RocketChat.roomTypes.add('starredRooms', 'user');
	RocketChat.roomTypes.add('channels', 'user');
	RocketChat.roomTypes.add('directMessages', 'user');
	RocketChat.roomTypes.add('privateGroups', 'user');
