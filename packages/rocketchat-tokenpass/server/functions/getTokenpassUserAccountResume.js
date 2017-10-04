let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.getTokenpassUserAccountResume = function(user, cb) {
	try {
		if (user && user.services && user.services.tokenpass) {
			const balances = RocketChat.updateUserTokenpassBalances(user);

			return cb(null, {
				username: user.services.tokenpass.username,
				numberOfTokens: (balances && balances.length) || 0
			});
		} else {
			const result = HTTP.post(
				`${ RocketChat.settings.get('API_Tokenpass_URL') }/api/v1/account/${ user.services.tokenpass.id }`, {
					headers: {
						Accept: 'application/json',
						'User-Agent': userAgent
					},
					params: {
						oauth_token: user.services.tokenpass.accessToken
					}
				});

			console.log(result);

			return cb(null, result && result.data && result.data.result);
		}
	} catch (exception) {

		console.log(exception);

		return cb(
			(exception.response && exception.response.data && (exception.response.data.message || exception.response.data.error)) || t('Tokenpass_Command_Error_Unknown')
		);
	}
};
