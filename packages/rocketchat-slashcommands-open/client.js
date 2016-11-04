function Open(command, params/*, item*/) {
	var room, subscription, type;
	if (command !== 'open' || !Match.test(params, String)) {
		return;
	}
	room = params.trim();
	if (room.indexOf('#') !== -1) {
		type = 'c';
	}
	if (room.indexOf('@') !== -1) {
		type = 'd';
	}
	room = room.replace('#', '');
	room = room.replace('@', '');

	var query = {
		name: room
	};
	if (type) {
		query['t'] = type;
	}
	subscription = ChatSubscription.findOne(query);

	if (subscription) {
		FlowRouter.go(RocketChat.roomTypes.getRouteLink(subscription.t, subscription), null, FlowRouter.current().queryParams);
	}
}

RocketChat.slashCommands.add('open', Open, {
	description: 'Opens_a_channel_group_or_direct_message',
	params: 'room_name',
	clientOnly: true
});
