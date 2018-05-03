let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.getPublicTokenpassBalances = function(accessToken) {
	try {
		return HTTP.get(
			`${ RocketChat.settings.get('API_Tokenpass_URL') }/api/v1/tca/public/balances`, {
				headers: {
					Accept: 'application/json',
					'User-Agent': userAgent
				},
				params: {
					oauth_token: accessToken
				}
			}).data;
	} catch (error) {
		throw new Error(`Failed to fetch public tokenpass balances from Tokenpass. ${ error.message }`);
	}
};
