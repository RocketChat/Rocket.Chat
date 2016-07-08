function Open(command, params, item) {
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

	if (subscription !== null) {
		FlowRouter.go(RocketChat.roomTypes.getRouteLink(subscription.t, subscription));
	}
}

RocketChat.slashCommands.add('open', Open, {
	description: TAPi18n.__('Opens_a_channel_group_or_direct_message'),
	params: 'room name',
	clientOnly: true
});
