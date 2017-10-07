Meteor.call('checkTokenpassOAuthEnabled', (error, result) => {
	if (result && result === true) {
		RocketChat.slashCommands.add('tokenpass', null, {
			description: 'Tokenpass_Command_Tokenpass_Description'
		});
	}
});
