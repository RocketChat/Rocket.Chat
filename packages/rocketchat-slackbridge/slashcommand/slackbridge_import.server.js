function SlackBridgeImport(command, params, item) {
	var channel, room, user;
	if (command !== 'slackbridge-import' || !Match.test(params, String)) {
		return;
	}
	room = RocketChat.models.Rooms.findOneById(item.rid);
	channel = room.name;
	user = Meteor.users.findOne(Meteor.userId());
	RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
		_id: Random.id(),
		rid: item.rid,
		ts: new Date(),
		msg: TAPi18n.__('SlackBridge_is_importing_your_messages_at_s_', {
			postProcess: 'sprintf',
			sprintf: [channel]
		}, user.language)
	});

	RocketChat.SlackBridge.importMessages(item.rid, err => {
		if (err) {
			RocketChat.Notifications.notifyUser(user._id, 'message', {
				_id: Random.id(),
				rid: item.rid,
				ts: new Date(),
				msg: TAPi18n.__('SlackBridge_got_an_error_while_importing_your_messages_at_s__s_', {
					postProcess: 'sprintf',
					sprintf: [channel, err.message]
				}, user.language)
			});
		} else {
			RocketChat.Notifications.notifyUser(user._id, 'message', {
				_id: Random.id(),
				rid: item.rid,
				ts: new Date(),
				msg: TAPi18n.__('SlackBridge_has_finished_importing_your_messages_at_s_', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, user.language)
			});
		}
	});

	return SlackBridgeImport;
}

RocketChat.slashCommands.add('slackbridge-import', SlackBridgeImport);
