let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.registerTokenpassAddress = function(accessToken, address, cb) {
	if (!accessToken) {
		return cb(TAPi18n.__('Tokenpass_Command_Error_NotLoggedIn'));
	}
	try {
		const result = HTTP.post(
			// See http://apidocs.tokenly.com/tokenpass/#register-address
			`${ RocketChat.settings.get('API_Tokenpass_URL') }/api/v1/tca/address`, {
				headers: {
					Accept: 'application/json',
					'User-Agent': userAgent
				},
				params: {
					oauth_token: accessToken
				},
				data: {
					address
				}
			});
		return cb(null, result && result.data && result.data.result);
	} catch (exception) {
		return cb(
			(exception.response && exception.response.data && (exception.response.data.message || exception.response.data.error)) || TAPi18n.__('Tokenpass_Command_Error_Unknown')
		);
	}
};
