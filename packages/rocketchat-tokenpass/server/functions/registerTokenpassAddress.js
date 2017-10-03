let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.registerTokenpassAddress = function(accessToken, address, cb) {
	try {
		const result = HTTP.post(
			`${ RocketChat.settings.get('API_Tokenpass_URL') }/api/v1/tca/address`, {
				headers: {
					Accept: 'application/json',
					'User-Agent': userAgent
				},
				params: {
					oauth_token: accessToken
				},
				data: {
					address // Bitcoin address to register
				}
			});
		return cb(null, result && result.data);
	} catch (error) {
		return cb(error);
	}
};
