function Open(command, params /*, item*/) {
	const dict = {
		'#': ['c', 'p'],
		'@': ['d']
	};

	if (command !== 'open' || !Match.test(params, String)) {
		return;
	}

	let room = params.trim();
	const type = dict[room[0]];
	room = room.replace(/#|@/, '');

	const query = {
		name: room
	};

	if (type) {
		query['t'] = {
			$in: type
		};
	}

	const subscription = ChatSubscription.findOne(query);

	if (subscription) {
		RocketChat.roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	}

	if (type && type.indexOf('d') === -1) {
		return;
	}
	return Meteor.call('createDirectMessage', room, function(err) {
		if (err) {
			return;
		}
		const subscription = RocketChat.models.Subscriptions.findOne(query);
		RocketChat.roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	});

}

RocketChat.slashCommands.add('open', Open, {
	description: 'Opens_a_channel_group_or_direct_message',
	params: 'room_name',
	clientOnly: true
});
