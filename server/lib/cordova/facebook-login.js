function getIdentity(accessToken) {
	try {
		return HTTP.get('https://graph.facebook.com/me', {
			params: {
				access_token: accessToken
			}
		}).data;
	} catch (error) {
		throw _.extend(new Error(`Failed to fetch identity from Facebook. ${ error.message }`), {
			response: error.response
		});
	}
}

Accounts.registerLoginHandler(function(loginRequest) {
	if (!loginRequest.cordova) {
		return;
	}

	loginRequest = loginRequest.authResponse;

	const identity = getIdentity(loginRequest.accessToken);
	const serviceData = {
		accessToken: loginRequest.accessToken,
		expiresAt: Date.now() + 1000 * loginRequest.expiresIn
	};

	const whitelisted = ['id', 'email', 'name', 'first_name', 'last_name', 'link', 'username', 'gender', 'locale', 'age_range'];
	const fields = _.pick(identity, whitelisted);
	const options = {
		profile: {}
	};

	_.extend(serviceData, fields);
	_.extend(options.profile, fields);

	return Accounts.updateOrCreateUserFromExternalService('facebook', serviceData, options);
});
