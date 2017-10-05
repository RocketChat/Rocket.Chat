let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.verifyTokenpassAddress = function(accessToken, address, signature, cb) {
	try {
		const result = HTTP.post(
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
			});
		return cb(null, result && result.data && result.data.result);
	} catch (exception) {
		return cb(
			(exception.response && exception.response.data && (exception.response.data.message || exception.response.data.error)) || TAPi18n.__('Tokenpass_Command_Error_Unknown')
		);
	}
};
