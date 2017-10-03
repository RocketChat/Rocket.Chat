let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.verifyTokenpassAddress = function(accessToken, address, signature) {
	try {
		return HTTP.post(
			`${ RocketChat.settings.get('API_Tokenpass_URL') }/api/v1/tca/address/${ address }`, {
				headers: {
					Accept: 'application/json',
					'User-Agent': userAgent
				},
				params: {
					oauth_token: accessToken
				},
				data: {
					signature // Signed message of the verify_code field from the User Address Object
				}
			}).data;
	} catch (error) {
		throw error;
	}
};
