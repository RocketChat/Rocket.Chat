Meteor.call('checkTokenpassOAuthEnabled', (error, result) => {
	if (result && result === true) {
		RocketChat.slashCommands.add('lend', null, {
			description: 'Tokenpass_Command_Lend_Description',
			params: 'Tokenpass_Command_Lend_Params'
		});
	}
});
