function Open(command, params, item) {
	var channel, room, subscription;
	if (command !== 'open' || !Match.test(params, String)) {
		return;
	}
	channel = params.trim();
	if (channel === '') {
		room = RocketChat.models.Rooms.findOneById(item.rid);
		channel = room.name;
	} else {
		channel = channel.replace('#', '');
	}
	subscription = ChatSubscription.findOne({
		name: channel
	});

	if (subscription !== null) {
		Meteor.call('openRoom', subscription.rid);
	}
}

RocketChat.slashCommands.add('open', Open, {
	description: TAPi18n.__('Open_A_Channel'),
	params: '#channel'
});
