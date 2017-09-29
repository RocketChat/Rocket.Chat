function TokenpassRegister(command, params, item) {
	if (command !== 'tokenpass' || !Match.test(params, String)) {
		return;
	}

	const user = Meteor.users.findOne(Meteor.userId());
	const channel = RocketChat.models.Rooms.findOneById(item.rid);

	console.log('tokenpass command', user);
}

RocketChat.slashCommands.add('tokenpass', TokenpassRegister);
