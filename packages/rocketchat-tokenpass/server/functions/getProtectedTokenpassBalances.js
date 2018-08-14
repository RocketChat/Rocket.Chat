let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.getProtectedTokenpassBalances = function(accessToken) {
	try {
		return HTTP.get(
			`${ RocketChat.settings.get('API_Tokenpass_URL') }/api/v1/tca/protected/balances`, {
				headers: {
					Accept: 'application/json',
					'User-Agent': userAgent
				},
				params: {
					oauth_token: accessToken
				}
			}).data;
	} catch (error) {
		throw new Error(`Failed to fetch protected tokenpass balances from Tokenpass. ${ error.message }`);
	}
};
