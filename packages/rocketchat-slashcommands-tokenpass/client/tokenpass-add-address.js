Meteor.call('checkTokenpassOAuthEnabled', (error, result) => {
	if (result && result === true) {
		RocketChat.slashCommands.add('tokenpass-add-address', null, {
			description: 'Tokenpass_Command_TokenpassAddAddress_Description',
			params: 'Tokenpass_Command_TokenpassAddAddress_Params'
		});
	}
});
