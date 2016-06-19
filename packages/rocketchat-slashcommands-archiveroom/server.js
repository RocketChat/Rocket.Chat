function Archive(command, params, item) {
	var channel, room, user;
	if (command !== 'archive' || !Match.test(params, String)) {
		return;
	}
	channel = params.trim();
	if (channel === '') {
		return;
	}
	channel = channel.replace('#', '');

	user = Meteor.users.findOne(Meteor.userId());
	room = RocketChat.models.Rooms.findOneByName(channel);
	if (room.archived) {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date(),
			msg: TAPi18n.__('Duplicate_archived_channel_name', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user.language)
		});
		return;
	}
	Meteor.call('archiveRoom', room._id);

	RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
		_id: Random.id(),
		rid: item.rid,
		ts: new Date(),
		msg: TAPi18n.__('Channel_Archived', {
			postProcess: 'sprintf',
			sprintf: [channel]
		}, user.language)
	});

	return Archive;
}

RocketChat.slashCommands.add('archive', Archive);
