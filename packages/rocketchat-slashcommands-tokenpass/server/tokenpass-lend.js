function Lend(command, params, item) {
	if (command !== 'lend' || !Match.test(params, String)) {
		return;
	}

	const paramsList = _.words(params);
	// TODO: Check parameters

	const user = Meteor.users.findOne(Meteor.userId());
	const channel = RocketChat.models.Rooms.findOneById(item.rid);

	const messages = [];

	RocketChat.lendTokenpassToken({
		source: paramsList[0], // Source address to use
		destination: paramsList[1], // Destination username
		asset: paramsList[2], // Token to promise
		quantity: paramsList[3], //	Amount, in satoshis
		expiration: (paramsList[4] && moment().add(paramsList[4], 'days')) || null // Time that the promise expires
	}, (error, result) => {
		if (error) {
			// TODO: Messages here
		} else if (result) {
			// TODO: Messages here
		} else {
			// TODO: Messages here
		}
	});

	messages.forEach((msg) => {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date(),
			msg
		});
	});
}

RocketChat.slashCommands.add('lend', Lend);
