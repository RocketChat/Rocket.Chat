const logger = new Logger('Blockstack');

// Blockstack login handler, triggered by a blockstack authResponse in route
Accounts.registerLoginHandler('blockstack', (loginRequest) => {
	logger.debug('Processing login request', loginRequest);

	if (!loginRequest.blockstack || !loginRequest.authResponse) {
		return;
	}

	const auth = Accounts.blockstack.handleAccessToken(loginRequest);

	// TODO: Fix #9484 and re-instate usage of accounts helper
	// const result = Accounts.updateOrCreateUserFromExternalService('blockstack', auth.serviceData, auth.options)
	const result = Accounts.blockstack.updateOrCreateUser(auth.serviceData, auth.options);
	logger.debug('User create/update result', result);

	// Ensure processing succeeded
	if (result === undefined || result.userId === undefined) {
		return {
			type: 'blockstack',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'User creation failed from Blockstack response token')
		};
	}

	// Send success and token back to account handlers
	return result;
});
