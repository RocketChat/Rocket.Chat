function Open(command, params /*, item*/) {
	const dict = {
		'#': 'c',
		'@': 'd'
	};
	var room, subscription, type;

	if (command !== 'open' || !Match.test(params, String)) {
		return;
	}

	room = params.trim();
	type = dict[room[0]];
	room = room.replace(/#|@/, '');

	var query = {
		name: room
	};

	if (type) {
		query['t'] = type;
	}

	subscription = ChatSubscription.findOne(query);

	if (subscription) {
		RocketChat.roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	}

	if (type && type !== 'd') {
		return;
	}
	return Meteor.call('createDirectMessage', room, function(err) {
		if (err) {
			return;
		}
		subscription = RocketChat.models.Subscriptions.findOne(query);
		RocketChat.roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	});

}

RocketChat.slashCommands.add('open', Open, {
	description: 'Opens_a_channel_group_or_direct_message',
	params: 'room_name',
	clientOnly: true
});
