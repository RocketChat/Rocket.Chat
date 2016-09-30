function Create(command, params, item) {
	var channel, room, user;
	if (command !== 'create' || !Match.test(params, String)) {
		return;
	}
	channel = params.trim();
	if (channel === '') {
		return;
	}

	user = Meteor.users.findOne(Meteor.userId());
	room = RocketChat.models.Rooms.findOneByName(channel);
	if (room != null) {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date(),
			msg: TAPi18n.__('Channel_already_exist', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user.language)
		});
		return;
	}
	Meteor.call('createChannel', channel, []);
}

RocketChat.slashCommands.add('create', Create);
