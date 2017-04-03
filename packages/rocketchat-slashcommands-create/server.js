function Create(command, params, item) {
	function getParams(str) {
		const regex = /(--(\w+))+/g;
		const result = [];
		let m;
		while ((m = regex.exec(str)) !== null) {
			if (m.index === regex.lastIndex) {
				regex.lastIndex++;
			}
			result.push(m[2]);
		}
		return result;
	}

	const regexp = /#?([\d-_\w]+)/g;
	if (command !== 'create' || !Match.test(params, String)) {
		return;
	}
	let channel = regexp.exec(params.trim());
	channel = channel ? channel[1] : '';
	if (channel === '') {
		return;
	}

	const user = Meteor.users.findOne(Meteor.userId());
	const room = RocketChat.models.Rooms.findOneByName(channel);
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

	if (getParams(params).indexOf('private') > -1) {
		return Meteor.call('createPrivateGroup', channel, []);
	}

	Meteor.call('createChannel', channel, []);
}

RocketChat.slashCommands.add('create', Create);
