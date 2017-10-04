function TokenpassRegister(command, params, item) {
	if (command !== 'tokenpass' || !Match.test(params, String)) {
		return;
	}

	const user = Meteor.users.findOne(Meteor.userId());
	const channel = RocketChat.models.Rooms.findOneById(item.rid);

	console.log('tokenpass command', user);

	const registeredOnTokenpass = false;

	const authenticatedWithTokenpass = !!(user && user.services && user.services.tokenpass);

	if (authenticatedWithTokenpass) {
		const tokenpassUserAccountResume = RocketChat.getTokenpassUserAccountResume(user);
	} else {
		RocketChat.registerTokenpassUserAccount(user, (error, result) => {

		});
	}

	// TODO: 2 - If user don't exists on Tokenpass, registers your e-mail and sends an e-mail verification
	if (!registeredOnTokenpass) {
		// Create Tokenpass Account
		RocketChat.registerTokenpassUserAccount(user, (error, result) => {

		});
	}

	// TODO: 3 - If user exists on Tokenpass but don't be authenticated, show a message requesting login on Rocket.Chat using Tokenpass
	if (registeredOnTokenpass && !authenticatedWithTokenpass) {
		// Request login with Tokenpass

	}
}

RocketChat.slashCommands.add('tokenpass', TokenpassRegister);
