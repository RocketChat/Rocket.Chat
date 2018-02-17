function Archive(command, params, item) {
	if (command !== 'archive' || !Match.test(params, String)) {
		return;
	}

	let channel = params.trim();
	let room;

	if (channel === '') {
		room = RocketChat.models.Rooms.findOneById(item.rid);
		channel = room.name;
	} else {
		channel = channel.replace('#', '');
		room = RocketChat.models.Rooms.findOneByName(channel);
	}

	const user = Meteor.users.findOne(Meteor.userId());

	if (!room) {
		return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date(),
			msg: TAPi18n.__('Channel_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user.language)
		});
	}

	// You can not archive direct messages.
	if (room.t === 'd') {
		return;
	}

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

	RocketChat.models.Messages.createRoomArchivedByRoomIdAndUser(room._id, Meteor.user());
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
