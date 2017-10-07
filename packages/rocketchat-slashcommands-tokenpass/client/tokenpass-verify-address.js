Meteor.call('checkTokenpassOAuthEnabled', (error, result) => {
	if (result && result === true) {
		RocketChat.slashCommands.add('tokenpass-verify-address', null, {
			description: 'Tokenpass_Command_TokenpassVerifyAddress_Description',
			params: 'Tokenpass_Command_TokenpassVerifyAddress_Params'
		});
	}
});
